import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getWeekDays } from '../utils/date';

export default function DayCarousel({ date, onSelect, onSettingsPress }) {
  const days = getWeekDays(date);
  const isToday = date.isSame(new Date(), 'day');
  const headerTitle = isToday ? 'Hôm nay' : date.format('DD/MM/YYYY');
  return (
    <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{headerTitle}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.gearBtn} onPress={onSettingsPress}>
          <Ionicons name="settings-outline" color={Colors.white} size={22} />
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>{date.format('dddd, [tháng] M, YYYY')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {days.map((d) => {
          const active = d.key === date.format('YYYY-MM-DD');
          return (
            <TouchableOpacity key={d.key} style={[styles.item, active && styles.active]} onPress={() => onSelect?.(d.date)}>
              <Text style={styles.weekday}>{d.weekday.toUpperCase()}</Text>
              <View style={[styles.circle, active && styles.circleActive]}>
                <Text style={[styles.dayText, active && styles.activeText]}>{d.label}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.primary, paddingTop: 40, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  header: { color: Colors.white, fontSize: 36, fontWeight: '800' },
  gearBtn: { padding: 8, borderRadius: 16 },
  sub: { color: Colors.white, opacity: 0.9, paddingHorizontal: 20, marginTop: 4 },
  row: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  item: { alignItems: 'center', marginRight: 14 },
  active: { opacity: 1, transform: [{ scale: 1.08 }] },
  weekday: { color: '#e7fbff', fontSize: 12, opacity: 0.7 },
  circle: { marginTop: 6, width: 44, height: 44, borderRadius: 22, backgroundColor: '#78c3cd', alignItems: 'center', justifyContent: 'center' },
  circleActive: { backgroundColor: Colors.white, borderWidth: 3, borderColor: '#88d4de', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  dayText: { color: Colors.white, fontWeight: '700' },
  activeText: { color: Colors.primary, fontWeight: '800' },
});
