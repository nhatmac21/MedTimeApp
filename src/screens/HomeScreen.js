import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, ActivityIndicator } from 'react-native';
import { getAlarmSoundForMedication, stopAlarmSound } from '../services/alarmService';
import { useFocusEffect } from '@react-navigation/native';
import Dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Colors } from '../theme/colors';
import DayCarousel from '../components/DayCarousel';
import SectionHeader from '../components/SectionHeader';
import MedicationCard from '../components/MedicationCard';
import AlarmModal from '../components/AlarmModal';
import useClock from '../hooks/useClock';
import { getPrescriptions, getPrescriptionSchedules, getMedicines, deletePrescription, createIntakeLog, getIntakeLogs } from '../services/auth';
import { scheduleReminder, buildDateFromTime, cancelAllReminders } from '../services/notifications';
import SettingsScreen from './SettingsScreen';

// Configure dayjs for Vietnam timezone
Dayjs.extend(utc);
Dayjs.extend(timezone);
Dayjs.tz.setDefault('Asia/Ho_Chi_Minh');


export default function HomeScreen({ navigation, route, onLogout }) {
  const now = useClock(1000);
  const [date, setDate] = useState(Dayjs());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [medicines, setMedicines] = useState({});
  const [showSettings, setShowSettings] = useState(false);
  const [alarmMedication, setAlarmMedication] = useState(null);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [triggeredAlarms, setTriggeredAlarms] = useState(new Set());

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
      
      for (const prescription of activePrescriptions) {
        const prescriptionSchedules = schedulesResult.data.items.filter(
          s => s.prescriptionid === prescription.prescriptionid
        );

        console.log(`Prescription ${prescription.prescriptionid} has ${prescriptionSchedules.length} schedules`);

        // Get alarm sound for this prescription
        const alarmSound = await getAlarmSoundForMedication(prescription.prescriptionid);

        for (const schedule of prescriptionSchedules) {
          // Skip schedules with null interval (default backend schedules)
          if (schedule.interval === null || schedule.interval === undefined) {
            console.log(`Skipping schedule ${schedule.scheduleid} with null interval`);
            continue;
          }

          // Check if schedule should be displayed today based on repeatPattern
          let shouldDisplay = true;
          
          if (schedule.repeatPattern === 'EVERY_X_DAYS' && schedule.interval) {
            // Calculate days since start date
            const startDate = Dayjs(prescription.startdate);
            const daysSinceStart = selectedDate.diff(startDate, 'day');
            shouldDisplay = daysSinceStart % schedule.interval === 0;
            console.log(`EVERY_X_DAYS schedule: interval=${schedule.interval}, daysSinceStart=${daysSinceStart}, display: ${shouldDisplay}`);
          } else if (schedule.repeatPattern === 'WEEKLY' && schedule.dayOfWeek) {
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
              status: 'pending', // Default status, will be updated from intake logs
              notificationEnabled: schedule.notificationenabled,
              alarmSound: alarmSound
            });
          }
        }
      }

      // Load intake logs and update medication status
      console.log('Loading intake logs...');
      const intakeLogsResult = await getIntakeLogs(1, 100);
      
      if (intakeLogsResult.success && intakeLogsResult.data?.items) {
        const logs = intakeLogsResult.data.items;
        console.log(`Loaded ${logs.length} intake logs`);
        
        // Update medication status based on logs
        medications.forEach(med => {
          // Find matching log for this medication on selected date
          const matchingLog = logs.find(log => {
            // Check if prescriptionid and scheduleid match
            if (log.prescriptionid !== med.prescriptionId || log.scheduleid !== med.scheduleId) {
              return false;
            }
            
            // Check if actiontime is on the selected date
            const logDate = Dayjs(log.actiontime).format('YYYY-MM-DD');
            const isMatchingDate = logDate === selectedDateStr;
            
            if (isMatchingDate) {
              console.log(`Found matching log for med ${med.name}: prescription=${log.prescriptionid}, schedule=${log.scheduleid}, date=${logDate}`);
            }
            
            return isMatchingDate;
          });
          
          if (matchingLog) {
            med.status = 'taken';
            med.takenAt = Dayjs(matchingLog.actiontime).format('H:mm');
            console.log(`Marked ${med.name} as taken at ${med.takenAt}`);
          }
        });
      } else {
        console.log('No intake logs found or failed to load');
      }

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

  // Check for alarms that need to trigger
  useEffect(() => {
    const checkAlarms = () => {
      const currentTime = now.format('HH:mm');
      const currentDate = date.format('YYYY-MM-DD');
      
      // Find medications that should alarm now
      const alarmMeds = data.filter(med => {
        const alarmKey = `${currentDate}-${med.prescriptionId}-${med.time}`;
        return (
          med.time === currentTime && 
          med.status === 'pending' &&
          med.notificationEnabled &&
          !triggeredAlarms.has(alarmKey) // Don't trigger same alarm twice
        );
      });

      if (alarmMeds.length > 0 && !showAlarmModal) {
        const firstMed = alarmMeds[0];
        const alarmKey = `${currentDate}-${firstMed.prescriptionId}-${firstMed.time}`;
        
        console.log('Triggering alarm for:', firstMed.name, 'at', currentTime);
        
        // Mark this alarm as triggered
        setTriggeredAlarms(prev => new Set([...prev, alarmKey]));
        
        // Show alarm
        setAlarmMedication(firstMed);
        setShowAlarmModal(true);
      }
    };

    checkAlarms();
  }, [now, data, showAlarmModal, date, triggeredAlarms]);
  
  // Reset triggered alarms when date changes
  useEffect(() => {
    setTriggeredAlarms(new Set());
  }, [date]);

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

  const handleMarkTaken = async (medication) => {
    try {
      console.log('=== MARK TAKEN ===');
      console.log('Medication:', medication);
      
      // Build actiontime from scheduled reminder time (medication.time) and current date
      const scheduledTime = `${date.format('YYYY-MM-DD')}T${medication.time}:00`;
      console.log('Scheduled reminder time:', scheduledTime);
      
      // Call API to log intake
      const intakeData = {
        prescriptionid: medication.prescriptionId,
        scheduleid: medication.scheduleId,
        actiontime: scheduledTime, // Use scheduled reminder time
        action: 'taken',
        confirmedBy: 'user',
        notes: medication.notes || ''
      };
      
      console.log('Creating intake log:', intakeData);
      const result = await createIntakeLog(intakeData);
      
      if (result.success) {
        console.log('✅ Intake log created successfully');
        
        // Update local state
        setData((prev) =>
          prev.map((med) =>
            med.id === medication.id
              ? { ...med, status: 'taken', takenAt: now.format('H:mm') }
              : med
          )
        );
        
        // Optional: Show success message
        // Alert.alert('Thành công', 'Đã ghi nhận uống thuốc');
      } else {
        console.error('❌ Failed to create intake log:', result.error);
        Alert.alert('Lỗi', result.error || 'Không thể ghi nhận uống thuốc');
      }
    } catch (error) {
      console.error('Error marking taken:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi ghi nhận uống thuốc');
    }
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

  const handleDeleteMedication = (medication) => {
    Alert.alert(
      'Xóa nhắc nhở',
      `Bạn có chắc chắn muốn xóa nhắc nhở "${medication.name}"?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting prescription:', medication.prescriptionId);
              const result = await deletePrescription(medication.prescriptionId);
              
              if (result.success) {
                // Remove from local state
                setData((prev) => prev.filter((med) => med.prescriptionId !== medication.prescriptionId));
                
                Alert.alert('Thành công', 'Đã xóa nhắc nhở thành công');
                
                // Reload data to ensure sync with backend
                loadMedicationsForDate(date, true);
              } else {
                Alert.alert('Lỗi', result.error || 'Không thể xóa nhắc nhở');
              }
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa nhắc nhở');
            }
          },
        },
      ]
    );
  };

  const handleAlarmDismiss = async () => {
    console.log('HomeScreen: Dismissing alarm modal');
    
    // Log intake in background (don't wait for result)
    if (alarmMedication && alarmMedication.prescriptionId && alarmMedication.scheduleId) {
      logIntake(alarmMedication.prescriptionId, alarmMedication.scheduleId).catch(err => {
        console.error('Error logging intake:', err);
      });
    }
    
    // Stop alarm sound (independent of API call)
    await stopAlarmSound();
    
    // Close modal and clear state
    setShowAlarmModal(false);
    setAlarmMedication(null);
    
    console.log('HomeScreen: Alarm dismissed successfully');
  };

  const logIntake = async (prescriptionId, scheduleId) => {
    try {
      console.log(`Logging intake for prescription ${prescriptionId}, schedule ${scheduleId}`);
      
      // Find the medication to get its scheduled time
      const medication = data.find(med => 
        med.prescriptionId === prescriptionId && med.scheduleId === scheduleId
      );
      
      // Build actiontime from scheduled reminder time
      const scheduledTime = medication 
        ? `${date.format('YYYY-MM-DD')}T${medication.time}:00`
        : Dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm:ss');
      
      console.log('Logging intake at scheduled time:', scheduledTime);
      
      const result = await createIntakeLog({
        prescriptionid: prescriptionId,
        scheduleid: scheduleId,
        actiontime: scheduledTime,
        action: 'taken',
        confirmedBy: 'user',
        notes: '',
      });

      if (result.success) {
        console.log('Intake logged successfully');
        // Reload medications to update status
        loadMedicationsForDate(date, false);
      } else {
        console.log('Failed to log intake:', result.error);
      }
    } catch (error) {
      console.error('Error in logIntake:', error);
    }
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
                        : ''
                    }
                    onTake={() => handleMarkTaken(med)}
                    onSkip={null}
                    onDelete={() => handleDeleteMedication(med)}
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

      <AlarmModal
        visible={showAlarmModal}
        medication={alarmMedication}
        onDismiss={handleAlarmDismiss}
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
