import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import Dayjs from 'dayjs';
import { Colors } from '../theme/colors';
import DayCarousel from '../components/DayCarousel';
import SectionHeader from '../components/SectionHeader';
import MedicationCard from '../components/MedicationCard';
import useClock from '../hooks/useClock';
import { fetchMedicationsForDate, markDose } from '../services/medicationsApi';
import { scheduleReminder, buildDateFromTime, cancelAllReminders } from '../services/notifications';
import { deleteMedicationByNameAndTime } from '../services/storage';

export default function HomeScreen() {
  const now = useClock(1000);
  const [date, setDate] = useState(Dayjs());
  const [data, setData] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchMedicationsForDate(date.format('YYYY-MM-DD')).then((d) => mounted && setData(d));
    return () => { mounted = false; };
  }, [date]);

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
              // Reload data
              const newData = await fetchMedicationsForDate(date.format('YYYY-MM-DD'));
              setData(newData);
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
});
