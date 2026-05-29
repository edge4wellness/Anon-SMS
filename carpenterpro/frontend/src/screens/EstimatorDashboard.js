import React, { useEffect, useReducer, useCallback, useState } from 'react';
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
import { v4 as uuidv4 } from 'uuid';
import { calcSectionTotal, calcLumpSum } from '../utils/calcEngine';
import { upsertSection, getSectionsForProject } from '../database/localCache';
import { pushPendingChanges } from '../database/syncEngine';
import SaveProgressModal from '../components/SaveProgressModal';

function sectionsReducer(state, action) {
  switch (action.type) {
    case 'LOAD':
      return action.payload;
    case 'UPDATE_FIELD': {
      const { sectionKey, field, value } = action;
      return state.map(s =>
        s.section_key === sectionKey
          ? { ...s, [field]: value, updated_at: new Date().toISOString() }
          : s
      );
    }
    default:
      return state;
  }
}

export default function EstimatorDashboard({ project, template, authToken, onBack }) {
  const [sections, dispatch] = useReducer(sectionsReducer, []);
  const [dirty, setDirty] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Seed local sections from template if none exist yet
  useEffect(() => {
    async function loadSections() {
      let cached = await getSectionsForProject(project.id);
      if (!cached.length) {
        cached = template.sections.map(s => ({
          id: uuidv4(),
          project_id: project.id,
          section_key: s.key,
          material_cost: 0,
          labor_cost: 0,
          qty: 0,
          unit: s.default_unit,
          notes: '',
          updated_at: new Date().toISOString(),
        }));
        await Promise.all(cached.map(upsertSection));
      }
      dispatch({ type: 'LOAD', payload: cached });
    }
    loadSections();
  }, [project.id, template]);

  function handleFieldChange(sectionKey, field, rawValue) {
    const value = field === 'notes' ? rawValue : parseFloat(rawValue) || 0;
    dispatch({ type: 'UPDATE_FIELD', sectionKey, field, value });
    setDirty(true);
  }

  const lumpSum = calcLumpSum(sections);

  async function saveLocally() {
    await Promise.all(sections.map(upsertSection));
    setDirty(false);
    setShowSaveModal(false);
  }

  async function saveAndSync() {
    await saveLocally();
    setSyncing(true);
    try {
      const { pushed } = await pushPendingChanges(authToken);
      Alert.alert('Synced', `${pushed} section(s) saved to cloud.`);
    } catch (e) {
      Alert.alert('Sync Failed', e.message);
    } finally {
      setSyncing(false);
    }
  }

  function handleBack() {
    if (dirty) {
      setShowSaveModal(true);
    } else {
      onBack();
    }
  }

  const sectionDefs = Object.fromEntries(template.sections.map(s => [s.key, s]));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{project.name}</Text>
        <TouchableOpacity onPress={saveAndSync} disabled={syncing}>
          <Text style={[styles.syncBtn, syncing && styles.syncBtnDisabled]}>
            {syncing ? 'Syncing…' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lump sum banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Estimated Total</Text>
        <Text style={styles.bannerTotal}>
          ${lumpSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>

      {/* Section list */}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {sections.map(section => {
          const def = sectionDefs[section.section_key] ?? {};
          const total = calcSectionTotal(section);
          return (
            <View key={section.section_key} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{def.label ?? section.section_key}</Text>
                <Text style={styles.sectionTotal}>
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.row}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Material</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={String(section.material_cost)}
                    onChangeText={v => handleFieldChange(section.section_key, 'material_cost', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Labor</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={String(section.labor_cost)}
                    onChangeText={v => handleFieldChange(section.section_key, 'labor_cost', v)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={[styles.fieldGroup, styles.fieldGroupSmall]}>
                  <Text style={styles.fieldLabel}>Qty</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={String(section.qty)}
                    onChangeText={v => handleFieldChange(section.section_key, 'qty', v)}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <SaveProgressModal
        visible={showSaveModal}
        onSave={async () => { await saveAndSync(); onBack(); }}
        onSaveLocal={async () => { await saveLocally(); onBack(); }}
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
  backBtn: { fontSize: 15, color: '#1A73E8', fontWeight: '500', width: 60 },
  title: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', flex: 1, textAlign: 'center' },
  syncBtn: { fontSize: 15, color: '#1A73E8', fontWeight: '600', width: 60, textAlign: 'right' },
  syncBtnDisabled: { color: '#AAA' },
  banner: {
    backgroundColor: '#1A73E8',
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bannerLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 2 },
  bannerTotal: { fontSize: 34, fontWeight: '800', color: '#FFF' },
  scroll: { padding: 14 },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  sectionTotal: { fontSize: 14, fontWeight: '700', color: '#1A73E8' },
  row: { flexDirection: 'row', gap: 8 },
  fieldGroup: { flex: 1 },
  fieldGroupSmall: { flex: 0.6 },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 4 },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
});
