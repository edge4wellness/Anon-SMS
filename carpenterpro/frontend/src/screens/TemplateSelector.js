import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function TemplateSelector({ onSelect, onBack }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/templates`)
      .then(r => r.json())
      .then(setTemplates)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleConfirm() {
    if (selected) onSelect(selected);
  }

  function renderItem({ item }) {
    const isSelected = selected?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelected(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardId, isSelected && styles.cardIdSelected]}>{item.id}</Text>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.cardName, isSelected && styles.cardNameSelected]}>{item.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.sectionCount}>{item.sections.length} sections</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Template</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1A73E8" />}
      {error && <Text style={styles.error}>Failed to load templates: {error}</Text>}

      {!loading && !error && (
        <>
          <FlatList
            data={templates}
            keyExtractor={t => t.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btn, !selected && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={!selected}
            >
              <Text style={styles.btnText}>
                {selected ? `Use "${selected.name}"` : 'Select a Template'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  },
  backBtn: { fontSize: 15, color: '#1A73E8', fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardSelected: { borderColor: '#1A73E8', backgroundColor: '#F0F6FF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardId: { fontSize: 11, fontWeight: '700', color: '#AAA', letterSpacing: 0.5 },
  cardIdSelected: { color: '#1A73E8' },
  checkmark: { fontSize: 14, color: '#1A73E8', fontWeight: '700' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  cardNameSelected: { color: '#1A73E8' },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 8 },
  sectionCount: { fontSize: 12, color: '#AAA', fontWeight: '500' },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
  },
  btn: {
    backgroundColor: '#1A73E8',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#BCD4F8' },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  error: { padding: 20, color: '#D93025', textAlign: 'center' },
});
