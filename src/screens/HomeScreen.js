import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Dayjs from 'dayjs';
import { Colors } from '../theme/colors';
import DayCarousel from '../components/DayCarousel';
import SectionHeader from '../components/SectionHeader';
import MedicationCard from '../components/MedicationCard';
import useClock from '../hooks/useClock';
import { getPrescriptions, getPrescriptionSchedules, getMedicines } from '../services/auth';
import { scheduleReminder, buildDateFromTime, cancelAllReminders } from '../services/notifications';
import SettingsScreen from './SettingsScreen';


export default function HomeScreen({ navigation, route, onLogout }) {
  const now = useClock(1000);
  const [date, setDate] = useState(Dayjs());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [medicines, setMedicines] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  const loadMedicationsForDate = async (selectedDate, showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      // Load medicines for name mapping
      const medicinesResult = await getMedicines(1, 100);
      const medicineMap = {};
      if (medicinesResult.success) {
        medicinesResult.data.items.forEach(med => {
          medicineMap[med.medicineid] = med.name;
        });
        setMedicines(medicineMap);
        console.log('Medicine map loaded:', medicineMap);
      }

      // Load prescriptions (load more items for HomeScreen to filter by date)
      const prescriptionsResult = await getPrescriptions(1, 100);
      console.log('Prescriptions result:', prescriptionsResult);
      
      if (!prescriptionsResult || !prescriptionsResult.success || !prescriptionsResult.data || !prescriptionsResult.data.items || prescriptionsResult.data.items.length === 0) {
        console.log('No prescriptions found');
        setData([]);
        setLoading(false);
        if (showRefreshIndicator) setIsRefreshing(false);
        return;
      }

      const prescriptions = prescriptionsResult.data.items;
      console.log('Prescriptions array:', prescriptions);

      // Load prescription schedules (load more items for HomeScreen to filter by date)
      const schedulesResult = await getPrescriptionSchedules(1, 100);
      console.log('Schedules result:', schedulesResult);
      
      if (!schedulesResult || !schedulesResult.success || !schedulesResult.data || !schedulesResult.data.items) {
        console.log('No schedules found');
        setData([]);
        setLoading(false);
        if (showRefreshIndicator) setIsRefreshing(false);
        return;
      }

      // Filter prescriptions for selected date
      const selectedDateStr = selectedDate.format('YYYY-MM-DD');
      console.log('Selected date:', selectedDateStr);
      
      const activePrescriptions = prescriptions.filter(p => {
        const isActive = p.startdate <= selectedDateStr && p.enddate >= selectedDateStr;
        console.log(`Prescription ${p.prescriptionid}: ${p.startdate} to ${p.enddate}, active: ${isActive}`);
        return isActive;
      });

      console.log(`Active prescriptions: ${activePrescriptions.length}`);

      // Combine prescriptions with schedules
      const medications = [];
      
      activePrescriptions.forEach(prescription => {
        const prescriptionSchedules = schedulesResult.data.items.filter(
          s => s.prescriptionid === prescription.prescriptionid
        );

        console.log(`Prescription ${prescription.prescriptionid} has ${prescriptionSchedules.length} schedules`);

        prescriptionSchedules.forEach(schedule => {
          // Check if schedule should be displayed today based on repeatPattern
          let shouldDisplay = true;
          
          if (schedule.repeatPattern === 'WEEKLY' && schedule.dayOfWeek) {
            const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const selectedDay = dayNames[selectedDate.day()];
            shouldDisplay = schedule.dayOfWeek.toUpperCase() === selectedDay;
            console.log(`Weekly schedule: ${schedule.dayOfWeek} vs ${selectedDay}, display: ${shouldDisplay}`);
          } else if (schedule.repeatPattern === 'MONTHLY' && schedule.dayofmonth) {
            const selectedDayOfMonth = selectedDate.date();
            shouldDisplay = schedule.dayofmonth === selectedDayOfMonth;
            console.log(`Monthly schedule: ${schedule.dayofmonth} vs ${selectedDayOfMonth}, display: ${shouldDisplay}`);
          }
          // DAILY schedules always display

          if (shouldDisplay) {
            medications.push({
              id: `${prescription.prescriptionid}-${schedule.scheduleid}`,
              prescriptionId: prescription.prescriptionid,
              scheduleId: schedule.scheduleid,
              name: medicineMap[prescription.medicineid] || `Thuốc ID: ${prescription.medicineid}`,
              dosage: prescription.dosage,
              notes: prescription.notes,
              time: schedule.timeofday ? schedule.timeofday.substring(0, 5) : '08:00', // HH:mm format
              status: 'pending', // Default status, can be updated later
              notificationEnabled: schedule.notificationenabled
            });
          }
        });
      });

      setData(medications);
      console.log(`Loaded ${medications.length} medications for ${selectedDateStr}`);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thuốc');
    } finally {
      setLoading(false);
      if (showRefreshIndicator) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadMedicationsForDate(date);
  }, [date]);

  // Reload data when screen comes into focus (e.g., after login)
  useFocusEffect(
    React.useCallback(() => {
      console.log('HomeScreen: Screen focused, reloading data');
      loadMedicationsForDate(date);
    }, [date])
  );

  // Listen for navigation params to reload data
  useEffect(() => {
    if (route.params?.shouldReload) {
      console.log('HomeScreen: Reloading data due to shouldReload param');
      loadMedicationsForDate(date, true); // Show refresh indicator
      // Clear the param to prevent multiple reloads
      navigation.setParams({ shouldReload: false });
    }
  }, [route.params?.shouldReload, date, navigation]);

  // Lên lịch thông báo cho các liều chưa uống
  useEffect(() => {
    (async () => {
      // Hủy tất cả thông báo cũ
      await cancelAllScheduledNotifications();
      
      console.log(`Lập lịch thông báo cho ${data.length} loại thuốc`);
      
      // Lập lịch thông báo mới cho từng liều thuốc
      for (const med of data) {
        if (med.status === 'taken' || med.status === 'skipped' || !med.notificationEnabled) continue;
        
        const triggerDate = buildDateFromTime(date.toDate(), med.time);
        const inFuture = triggerDate.getTime() > Date.now();
        if (inFuture) {
          await scheduleReminder({
            title: `Nhắc uống: ${med.name}`,
            body: `${med.dosage}${med.notes ? `, ${med.notes}` : ''}`,
            date: triggerDate,
          });
        }
      }
    })();
  }, [data, date]);

  const grouped = useMemo(() => {
    const m = new Map();
    
    // Remove duplicates: same prescriptionId and time
    const uniqueMeds = [];
    const seen = new Set();
    
    data.forEach((med) => {
      const key = `${med.prescriptionId}-${med.time}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMeds.push(med);
      } else {
        console.log(`Skipping duplicate medication: ${med.name} at ${med.time}`);
      }
    });
    
    // Group by time
    uniqueMeds.forEach((med) => {
      const arr = m.get(med.time) || [];
      arr.push(med);
      m.set(med.time, arr);
    });
    
    return Array.from(m.entries()).sort(([a],[b]) => a.localeCompare(b));
  }, [data]);

  const handleMarkTaken = (medication) => {
    setData((prev) =>
      prev.map((med) =>
        med.id === medication.id
          ? { ...med, status: 'taken', takenAt: now.format('H:mm') }
          : med
      )
    );
  };

  const handleMarkSkipped = (medication) => {
    setData((prev) =>
      prev.map((med) =>
        med.id === medication.id
          ? { ...med, status: 'skipped' }
          : med
      )
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DayCarousel date={date} onSelect={setDate} onSettingsPress={() => setShowSettings(true)} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách thuốc...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <DayCarousel date={date} onSelect={setDate} onSettingsPress={() => setShowSettings(true)} />
        {isRefreshing && (
          <View style={styles.refreshIndicator}>
            <Text style={styles.refreshText}>🔄 Đang cập nhật danh sách thuốc...</Text>
          </View>
        )}
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 30 }}>
          {grouped.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có thuốc nào trong ngày này</Text>
            </View>
          ) : (
            grouped.map(([time, medications]) => (
              <View key={time}>
                <SectionHeader title={time} />
                {medications.map((med) => (
                  <MedicationCard
                    key={med.id}
                    name={med.name}
                    dosage={med.dosage}
                    quantity={med.notes || ''}
                    status={med.status}
                    takenInfo={
                      med.status === 'taken'
                        ? `Đã uống lúc ${med.takenAt}`
                        : med.status === 'skipped'
                        ? `Bỏ qua lúc ${time}`
                        : ''
                    }
                    onTake={() => handleMarkTaken(med)}
                    onSkip={() => handleMarkSkipped(med)}
                    onDelete={null} // Disable delete for now, can be added later
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
      
      <SettingsScreen
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onLogout={onLogout}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
  },
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
