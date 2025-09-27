import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

export default function SectionHeader({ icon = 'time-outline', title }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}><Ionicons name={icon} size={16} color={Colors.textMuted} /></View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#5d8f9a33', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  title: { fontSize: 32, fontWeight: '600', color: Colors.textSecondary },
});
