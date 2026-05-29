import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ProjectCard({ project, onPress }) {
  const { customer_name, project_type, status, total_bid, last_modified_at } = project;

  const formattedDate = new Date(last_modified_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const formattedBid = total_bid != null
    ? `$${total_bid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(project)} activeOpacity={0.75}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{customer_name ?? 'Unnamed Project'}</Text>
        <View style={[styles.badge, styles[`badge_${status}`]]}>
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </View>

      <Text style={styles.type}>{project_type ?? '—'}</Text>

      <View style={styles.footer}>
        <Text style={styles.bid}>{formattedBid}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badge_draft:    { backgroundColor: '#F1F3F4' },
  badge_sent:     { backgroundColor: '#FEF7E0' },
  badge_accepted: { backgroundColor: '#E6F4EA' },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize', color: '#3C4043' },
  type: { fontSize: 12, color: '#888', marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  bid: { fontSize: 20, fontWeight: '700', color: '#1A73E8' },
  date: { fontSize: 12, color: '#AAA' },
});
