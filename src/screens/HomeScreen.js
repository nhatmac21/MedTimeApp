import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import Dayjs from 'dayjs';
import { Colors } from '../theme/colors';
import DayCarousel from '../components/DayCarousel';
import SectionHeader from '../components/SectionHeader';
import MedicationCard from '../components/MedicationCard';
import useClock from '../hooks/useClock';
import { fetchMedicationsForDate, markDose } from '../services/medicationsApi';
import { scheduleReminder, buildDateFromTime, cancelAllReminders } from '../services/notifications';
import { deleteMedicationByNameAndTime } from '../services/storage';

export default function HomeScreen({ navigation, route }) {
  const now = useClock(1000);
  const [date, setDate] = useState(Dayjs());
  const [data, setData] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMedicationsForDate = async (selectedDate, showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      const medications = await fetchMedicationsForDate(selectedDate.format('YYYY-MM-DD'));
      setData(medications);
      console.log(`Loaded ${medications.length} medications for ${selectedDate.format('YYYY-MM-DD')}`);
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadMedicationsForDate(date);
  }, [date]);

  // Listen for navigation params to reload data
  useEffect(() => {
    if (route.params?.shouldReload) {
      console.log('HomeScreen: Reloading data due to shouldReload param');
      loadMedicationsForDate(date, true); // Show refresh indicator
      // Clear the param to prevent multiple reloads
      navigation.setParams({ shouldReload: false });
    }
  }, [route.params?.shouldReload, date, navigation]);

  // Also reload when screen comes into focus (but only if no shouldReload param)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Only reload on focus if not already reloading due to shouldReload
      if (!route.params?.shouldReload) {
        console.log('HomeScreen: Reloading data due to focus');
        loadMedicationsForDate(date);
      }
    });

    return unsubscribe;
  }, [navigation, date, route.params?.shouldReload]);

  // Lên lịch thông báo cho các liều chưa uống
  useEffect(() => {
    (async () => {
      await cancelAllReminders();
      for (const med of data) {
        for (const t of med.times) {
          if (t.status === 'taken' || t.status === 'skipped') continue;
          const triggerDate = buildDateFromTime(date.toDate(), t.time);
          const inFuture = triggerDate.getTime() > Date.now();
          if (inFuture) {
            await scheduleReminder({
              title: `Nhắc uống: ${med.name}`,
              body: `${med.dosage}, uống ${t.quantity} viên lúc ${t.time}`,
              date: triggerDate,
            });
          }
        }
      }
    })();
  }, [data, date]);

  const grouped = useMemo(() => {
    const m = new Map();
    data.forEach((med) => {
      med.times.forEach((t) => {
        const arr = m.get(t.time) || [];
        arr.push({ med, t });
        m.set(t.time, arr);
      });
    });
    return Array.from(m.entries()).sort(([a],[b]) => a.localeCompare(b));
  }, [data]);

  const handleDeleteMedication = async (medName, time) => {
    Alert.alert(
      'Xóa thuốc',
      `Bạn có chắc muốn xóa "${medName}" lúc ${time}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMedicationByNameAndTime(medName, time);
            if (result.success) {
              // Reload data with refresh indicator
              await loadMedicationsForDate(date, true);
            } else {
              Alert.alert('Lỗi', 'Không thể xóa thuốc');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <DayCarousel date={date} onSelect={setDate} />
      {isRefreshing && (
        <View style={styles.refreshIndicator}>
          <Text style={styles.refreshText}>🔄 Đang cập nhật danh sách thuốc...</Text>
        </View>
      )}
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 30 }}>
        {grouped.map(([time, items]) => (
          <View key={time}>
            <SectionHeader title={time} />
            {items.map(({ med, t }) => (
              <MedicationCard
                key={med.id + time}
                name={med.name}
                dosage={med.dosage}
                quantity={t.quantity}
                status={t.status || 'pending'}
                takenInfo={
                  t.status === 'taken'
                    ? `Đã uống lúc ${t.takenAt}${t.repeats ? `, sau ${t.repeats} lần nhắc` : ''}`
                    : t.status === 'skipped'
                    ? t.note || `Bỏ qua lúc ${time}`
                    : ''
                }
                onTake={async () => {
                  await markDose({ medId: med.id, time, status: 'taken', takenAt: now.format('H:mm') });
                  setData((prev) => prev.map((mm) => mm.id === med.id ? { ...mm, times: mm.times.map((tt) => tt.time === time ? { ...tt, status: 'taken', takenAt: now.format('H:mm') } : tt) } : mm));
                }}
                onSkip={async () => {
                  await markDose({ medId: med.id, time, status: 'skipped' });
                  setData((prev) => prev.map((mm) => mm.id === med.id ? { ...mm, times: mm.times.map((tt) => tt.time === time ? { ...tt, status: 'skipped' } : tt) } : mm));
                }}
                onDelete={() => handleDeleteMedication(med.name, time)}
              />)
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  refreshIndicator: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  refreshText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
});
