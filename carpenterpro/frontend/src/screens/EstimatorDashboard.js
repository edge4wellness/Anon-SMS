import React, { useEffect, useReducer, useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  upsertProject,
  upsertMaterial,
  upsertLabor,
  getSectionsForProject,
  getMaterialsForProject,
  getLaborForProject,
} from '../database/localCache';
import { pushPendingChanges } from '../database/syncEngine';
import { calculateProjectTotal } from '../utils/calcEngine';
import SaveProgressModal from '../components/SaveProgressModal';

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'UPDATE_MATERIAL': {
      const { materialId, field, value } = action;
      return {
        ...state,
        materials: state.materials.map(m =>
          m.material_id === materialId ? { ...m, [field]: value } : m
        ),
      };
    }
    case 'UPDATE_LABOR': {
      const { laborId, field, value } = action;
      return {
        ...state,
        labor: state.labor.map(l =>
          l.labor_id === laborId ? { ...l, [field]: value } : l
        ),
      };
    }
    default:
      return state;
  }
}

const EMPTY = { sections: [], materials: [], labor: [] };

// ── Component ─────────────────────────────────────────────────────────────────

export default function EstimatorDashboard({ project, authToken, onBack }) {
  const [state, dispatch] = useReducer(reducer, EMPTY);
  const [dirty, setDirty] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function load() {
      const [sections, materials, labor] = await Promise.all([
        getSectionsForProject(project.project_id),
        getMaterialsForProject(project.project_id),
        getLaborForProject(project.project_id),
      ]);
      dispatch({ type: 'LOAD', payload: { sections, materials, labor } });
    }
    load();
  }, [project.project_id]);

  // Live recalculation on every state change
  const calc = useMemo(() => {
    if (!state.sections.length) return null;
    return calculateProjectTotal(
      project,
      state.sections,
      state.materials,
      state.labor,
      project.markup_percent ?? 20
    );
  }, [project, state]);

  // Map section_id → lump_sum_price for the proposal view
  const lumpSumBySectionId = useMemo(() => {
    if (!calc) return {};
    return Object.fromEntries(
      calc.client_proposal_view.sections.map(s => [s.section_id, s.lump_sum_price])
    );
  }, [calc]);

  function updateMaterial(materialId, field, raw) {
    const value = ['item_name', 'unit', 'category'].includes(field)
      ? raw
      : parseFloat(raw) || 0;
    dispatch({ type: 'UPDATE_MATERIAL', materialId, field, value });
    setDirty(true);
  }

  function updateLabor(laborId, field, raw) {
    const value = field === 'task_description' ? raw : parseFloat(raw) || 0;
    dispatch({ type: 'UPDATE_LABOR', laborId, field, value });
    setDirty(true);
  }

  async function persistAll() {
    if (!calc) return;
    const updatedProject = { ...project, ...calc.database_update };
    await upsertProject(updatedProject);
    await Promise.all(state.materials.map(upsertMaterial));
    await Promise.all(state.labor.map(upsertLabor));
    setDirty(false);
  }

  async function saveAndSync() {
    await persistAll();
    setSyncing(true);
    try {
      const { pushed } = await pushPendingChanges(authToken);
      Alert.alert('Synced', `${pushed} project(s) saved to cloud.`);
    } catch (e) {
      Alert.alert('Sync Failed', e.message);
    } finally {
      setSyncing(false);
      setShowSaveModal(false);
    }
  }

  function handleBack() {
    if (dirty) setShowSaveModal(true);
    else onBack();
  }

  // Group materials and labor by section_id for display
  const materialsBySection = {};
  const laborBySection = {};
  state.materials.forEach(m => { (materialsBySection[m.section_id] ??= []).push(m); });
  state.labor.forEach(l => { (laborBySection[l.section_id] ??= []).push(l); });

  const grandTotal = calc?.client_proposal_view.grand_total ?? 0;
  const totalMaterials = calc?.database_update.total_materials_cost ?? 0;
  const totalLabor = calc?.database_update.total_labor_cost ?? 0;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.navBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {project.customer_name ?? 'New Project'}
        </Text>
        <TouchableOpacity onPress={saveAndSync} disabled={syncing}>
          <Text style={[styles.navBtn, styles.navBtnRight, syncing && styles.navBtnDisabled]}>
            {syncing ? 'Syncing…' : 'Sync ↑'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bid banner — shows database_update totals */}
      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <View style={styles.bannerCell}>
            <Text style={styles.bannerLabel}>Materials</Text>
            <Text style={styles.bannerValue}>${totalMaterials.toFixed(2)}</Text>
          </View>
          <Text style={styles.bannerDivider}>|</Text>
          <View style={styles.bannerCell}>
            <Text style={styles.bannerLabel}>Labor</Text>
            <Text style={styles.bannerValue}>${totalLabor.toFixed(2)}</Text>
          </View>
          <Text style={styles.bannerDivider}>|</Text>
          <View style={styles.bannerCell}>
            <Text style={styles.bannerLabel}>Total Bid</Text>
            <Text style={[styles.bannerValue, styles.bannerBid]}>
              ${grandTotal.toFixed(2)}
            </Text>
          </View>
        </View>
        <Text style={styles.bannerMarkup}>
          {project.markup_percent ?? 20}% markup · client sees lump sum per section
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {state.sections.map(section => {
          const mats = materialsBySection[section.section_id] ?? [];
          const labs = laborBySection[section.section_id] ?? [];
          const lumpSum = lumpSumBySectionId[section.section_id] ?? 0;

          return (
            <View key={section.section_id} style={styles.sectionCard}>
              {/* Section header — lump_sum_price from client_proposal_view */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.area_name}</Text>
                <View style={styles.lumpBadge}>
                  <Text style={styles.lumpLabel}>Client Price</Text>
                  <Text style={styles.lumpValue}>${lumpSum.toFixed(2)}</Text>
                </View>
              </View>

              {/* Materials input rows */}
              {mats.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>MATERIALS</Text>
                  {mats.map(m => (
                    <View key={m.material_id} style={styles.lineRow}>
                      <Text style={styles.lineDesc} numberOfLines={1}>{m.item_name}</Text>
                      <View style={styles.lineFields}>
                        <View style={styles.microField}>
                          <Text style={styles.microLabel}>Qty</Text>
                          <TextInput
                            style={styles.microInput}
                            value={String(m.qty)}
                            onChangeText={v => updateMaterial(m.material_id, 'qty', v)}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.microField}>
                          <Text style={styles.microLabel}>$/unit</Text>
                          <TextInput
                            style={styles.microInput}
                            value={String(m.unit_cost)}
                            onChangeText={v => updateMaterial(m.material_id, 'unit_cost', v)}
                            keyboardType="numeric"
                          />
                        </View>
                        <Text style={styles.lineTotal}>
                          ${(m.qty * m.unit_cost).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Labor input rows */}
              {labs.length > 0 && (
                <>
                  <Text style={[styles.groupLabel, { marginTop: 10 }]}>LABOR</Text>
                  {labs.map(l => (
                    <View key={l.labor_id} style={styles.lineRow}>
                      <Text style={styles.lineDesc} numberOfLines={1}>{l.task_description}</Text>
                      <View style={styles.lineFields}>
                        <View style={styles.microField}>
                          <Text style={styles.microLabel}>Crew</Text>
                          <TextInput
                            style={styles.microInput}
                            value={String(l.crew_size)}
                            onChangeText={v => updateLabor(l.labor_id, 'crew_size', v)}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.microField}>
                          <Text style={styles.microLabel}>Hrs</Text>
                          <TextInput
                            style={styles.microInput}
                            value={String(l.hours_estimated)}
                            onChangeText={v => updateLabor(l.labor_id, 'hours_estimated', v)}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.microField}>
                          <Text style={styles.microLabel}>$/hr</Text>
                          <TextInput
                            style={styles.microInput}
                            value={String(l.hourly_rate)}
                            onChangeText={v => updateLabor(l.labor_id, 'hourly_rate', v)}
                            keyboardType="numeric"
                          />
                        </View>
                        <Text style={styles.lineTotal}>
                          ${(l.crew_size * l.hours_estimated * l.hourly_rate).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      <SaveProgressModal
        visible={showSaveModal}
        onSave={async () => { await saveAndSync(); onBack(); }}
        onSaveLocal={async () => { await persistAll(); setShowSaveModal(false); onBack(); }}
        onDiscard={() => { setShowSaveModal(false); onBack(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
  },
  navBtn: { fontSize: 15, color: '#1A73E8', fontWeight: '500', minWidth: 60 },
  navBtnRight: { textAlign: 'right' },
  navBtnDisabled: { color: '#AAA' },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  banner: { backgroundColor: '#1A73E8', paddingVertical: 14, paddingHorizontal: 16 },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerCell: { flex: 1, alignItems: 'center' },
  bannerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginBottom: 2 },
  bannerValue: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  bannerBid: { fontSize: 20 },
  bannerDivider: { color: 'rgba(255,255,255,0.3)', fontSize: 20 },
  bannerMarkup: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 6,
  },
  scroll: { padding: 12 },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  lumpBadge: { alignItems: 'flex-end' },
  lumpLabel: { fontSize: 10, color: '#AAA', fontWeight: '600' },
  lumpValue: { fontSize: 16, fontWeight: '800', color: '#1A73E8' },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAA',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  lineRow: { marginBottom: 8 },
  lineDesc: { fontSize: 13, color: '#333', marginBottom: 4 },
  lineFields: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  microField: { alignItems: 'center' },
  microLabel: { fontSize: 10, color: '#999', marginBottom: 2 },
  microInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 5,
    fontSize: 13,
    color: '#1A1A1A',
    width: 60,
    textAlign: 'center',
    backgroundColor: '#FAFAFA',
  },
  lineTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginLeft: 'auto',
    minWidth: 70,
    textAlign: 'right',
  },
});
