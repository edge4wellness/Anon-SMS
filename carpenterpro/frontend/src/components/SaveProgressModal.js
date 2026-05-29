import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

/**
 * "Save Progress" gate — shown before the user can navigate away from an
 * in-progress estimate.  Offers Save (cloud sync), Save Locally, and Discard.
 */
export default function SaveProgressModal({ visible, onSave, onSaveLocal, onDiscard }) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Save your progress?</Text>
          <Text style={styles.body}>
            You have unsaved changes. Choose how you'd like to save before leaving.
          </Text>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.btnPrimaryText}>Save &amp; Sync</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={onSaveLocal}
            disabled={saving}
          >
            <Text style={styles.btnSecondaryText}>Save Locally</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.discardBtn}
            onPress={onDiscard}
            disabled={saving}
          >
            <Text style={styles.discardText}>Discard Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#555',
    marginBottom: 24,
    lineHeight: 20,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnPrimary: {
    backgroundColor: '#1A73E8',
  },
  btnPrimaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: '#F1F3F4',
  },
  btnSecondaryText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
  },
  discardBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  discardText: {
    color: '#D93025',
    fontSize: 14,
    fontWeight: '500',
  },
});
