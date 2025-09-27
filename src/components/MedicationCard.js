import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const Check = () => <Ionicons name="checkmark" size={44} color={Colors.white} />;
const Cross = () => <Ionicons name="close" size={44} color={Colors.white} />;

export default function MedicationCard({
  name,
  dosage,
  quantity,
  status, // 'pending' | 'taken' | 'skipped'
  takenInfo, // string like 'Đã uống lúc 8:00'
  onTake,
  onSkip,
}) {
  const isTaken = status === 'taken';
  const isSkipped = status === 'skipped';
  const actionBg = isSkipped ? Colors.danger : Colors.success;
  return (
    <View style={[styles.wrapper, isSkipped && styles.wrapperAlt]}>
      <View style={styles.left}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.sub}>{dosage}, uống {quantity} viên</Text>
        {!!takenInfo && <Text style={styles.note}>{takenInfo}</Text>}
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.action, { backgroundColor: actionBg }, (isTaken || isSkipped) && styles.actionDisabled]}
        onPress={() => (isTaken ? onSkip?.() : onTake?.())}
        disabled={isTaken || isSkipped}
      >
        {isTaken ? <Check /> : isSkipped ? <Cross /> : <Check />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    marginVertical: 10,
  },
  wrapperAlt: { backgroundColor: Colors.primaryDark },
  left: { flex: 1, paddingRight: 10 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textSecondary },
  sub: { marginTop: 6, color: Colors.textMuted },
  note: { marginTop: 6, color: Colors.textSecondary, fontWeight: '500' },
  action: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  actionDisabled: { opacity: 1 },
});
