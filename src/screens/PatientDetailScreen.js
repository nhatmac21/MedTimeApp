import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import MedicationCard from '../components/MedicationCard';
import TimePicker from '../components/TimePicker';
import RepeatPatternPicker from '../components/RepeatPatternPicker';
import { getAuthToken, getMedicines, getIntakeLogs } from '../services/auth';

const API_BASE_URL = 'https://medtime-be.onrender.com/api';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export default function PatientDetailScreen({ route, navigation }) {
  const { patient } = route.params;
  const [medications, setMedications] = useState([]);
  const [medicines, setMedicines] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editingTime, setEditingTime] = useState('08:00');
  const [editingRepeatPattern, setEditingRepeatPattern] = useState({
    pattern: 'DAILY',
    interval: 1,
    dayOfWeek: null,
    dayOfMonth: null,
  });

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [patient.patientid])
  );

  const loadMedications = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      
      // Load medicines for name mapping
      const medicinesResult = await getMedicines(1, 100);
      const medicineMap = {};
      if (medicinesResult.success && medicinesResult.data?.items) {
        medicinesResult.data.items.forEach(med => {
          medicineMap[med.medicineid] = med;
        });
        setMedicines(medicineMap);
      }

      // Load prescriptions for patient
      const prescriptionsResponse = await fetch(
        `${API_BASE_URL}/prescription?pageNumber=1&pageSize=100&patientId=${patient.patientid}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const prescriptionsData = await prescriptionsResponse.json();
      
      if (!prescriptionsData.success || !prescriptionsData.data?.items) {
        setMedications([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const prescriptions = prescriptionsData.data.items;

      // Load prescription schedules for patient
      const schedulesResponse = await fetch(
        `${API_BASE_URL}/prescriptionschedule?pageNumber=1&pageSize=100&patientId=${patient.patientid}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const schedulesData = await schedulesResponse.json();
      
      if (!schedulesData.success || !schedulesData.data?.items) {
        setMedications([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Combine prescriptions with schedules and medicines
      const combinedMedications = [];
      
      for (const prescription of prescriptions) {
        const prescriptionSchedules = schedulesData.data.items.filter(
          s => s.prescriptionid === prescription.prescriptionid
        );

        const medicine = medicineMap[prescription.medicineid];

        // Only add one entry per prescription, with all schedules
        if (prescriptionSchedules.length > 0) {
          // Use the first schedule for display
          const mainSchedule = prescriptionSchedules[0];
          
          combinedMedications.push({
            prescriptionid: prescription.prescriptionid,
            scheduleid: mainSchedule.scheduleid,
            userid: prescription.userid,
            medicineid: prescription.medicineid,
            medicine: medicine,
            dosage: prescription.dosage,
            frequencyperday: prescription.frequencyperday,
            startdate: prescription.startdate,
            enddate: prescription.enddate,
            remainingquantity: prescription.remainingquantity,
            notes: prescription.notes,
            prescriptionschedule: {
              scheduleid: mainSchedule.scheduleid,
              prescriptionid: mainSchedule.prescriptionid,
              timeofday: mainSchedule.timeofday,
              interval: mainSchedule.interval,
              dayofmonth: mainSchedule.dayofmonth,
              repeatpattern: mainSchedule.repeatPattern || mainSchedule.repeatpattern,
              dayofweek: mainSchedule.dayOfWeek ?? mainSchedule.dayofweek,
              notificationenabled: mainSchedule.notificationenabled,
              customringtone: mainSchedule.customringtone,
            },
            allSchedules: prescriptionSchedules, // Keep all schedules for reference
            status: 'pending', // Default status, will be updated from intake logs
          });
        }
      }

      // Load intake logs for this patient
      console.log('Loading intake logs for patient:', patient.patientid);
      const intakeLogsResult = await getIntakeLogs(1, 100, patient.patientid);
      
      if (intakeLogsResult.success && intakeLogsResult.data?.items) {
        const logs = intakeLogsResult.data.items;
        console.log(`Loaded ${logs.length} intake logs for patient`);
        
        const today = dayjs();
        const todayStr = today.format('YYYY-MM-DD');
        
        // Update medication status based on logs
        combinedMedications.forEach(med => {
          // Find matching log for this medication today
          const matchingLog = logs.find(log => {
            // Check if prescriptionid and scheduleid match
            if (log.prescriptionid !== med.prescriptionid || 
                log.scheduleid !== med.prescriptionschedule?.scheduleid) {
              return false;
            }
            
            // Check if actiontime is today
            const logDate = dayjs(log.actiontime).format('YYYY-MM-DD');
            const isToday = logDate === todayStr;
            
            if (isToday) {
              console.log(`Found matching log for prescription ${med.prescriptionid}: schedule=${log.scheduleid}, date=${logDate}`);
            }
            
            return isToday;
          });
          
          if (matchingLog) {
            med.status = 'taken';
            med.takenAt = dayjs(matchingLog.actiontime).format('H:mm');
            console.log(`Marked prescription ${med.prescriptionid} as taken at ${med.takenAt}`);
          }
        });
      } else {
        console.log('No intake logs found or failed to load for patient');
      }

      setMedications(combinedMedications);
      
    } catch (error) {
      console.log('Error loading medications:', error);
      setMedications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMedications();
  };

  const handleEdit = (medication) => {
    navigation.navigate('GuardianEditor', {
      mode: 'edit',
      medication: medication,
      patient: patient,
    });
  };

  const handleDelete = async (medication) => {
    Alert.alert(
      'Xóa nhắc nhở',
      `Bạn có chắc chắn muốn xóa nhắc nhở "${medication.medicine?.name || 'thuốc này'}"?`,
      [
        {
          text: 'Hủy',
          style: 'cancel'
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              const response = await fetch(`${API_BASE_URL}/prescription/${medication.prescriptionid}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              const data = await response.json();
              
              if (data.success) {
                Alert.alert('Thành công', 'Đã xóa nhắc nhở');
                loadMedications();
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể xóa nhắc nhở');
              }
            } catch (error) {
              Alert.alert('Lỗi', 'Lỗi kết nối, vui lòng thử lại');
            }
          }
        }
      ]
    );
  };

  const handleEditTime = (medication) => {
    if (!medication.prescriptionschedule) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin lịch nhắc nhở');
      return;
    }
    const schedule = medication.prescriptionschedule;
    const currentTime = schedule.timeofday || '08:00:00';
    setEditingSchedule(schedule);
    setEditingTime(currentTime.substring(0, 5)); // HH:MM format
    setEditingRepeatPattern({
      pattern: schedule.repeatpattern?.toUpperCase() || 'DAILY',
      interval: schedule.interval || 1,
      dayOfWeek: schedule.dayofweek,
      dayOfMonth: schedule.dayofmonth,
    });
    setShowEditModal(true);
  };

  const updateScheduleTime = async () => {
    if (!editingSchedule) return;

    try {
      const token = await getAuthToken();
      const scheduleId = editingSchedule.scheduleid;
      
      const payload = {
        timeofday: `${editingTime}:00`,
        interval: editingRepeatPattern.interval,
        dayofmonth: editingRepeatPattern.dayOfMonth,
        repeatPattern: editingRepeatPattern.pattern.toLowerCase(),
        dayOfWeek: editingRepeatPattern.dayOfWeek,
        notificationenabled: editingSchedule.notificationenabled !== false,
        customringtone: editingSchedule.customringtone || 'alarm1',
      };

      const response = await fetch(
        `${API_BASE_URL}/prescriptionschedule/${scheduleId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert('Thành công', 'Đã cập nhật lịch nhắc nhở');
        setShowEditModal(false);
        loadMedications(); // Reload to show updated time
      } else {
        Alert.alert('Lỗi', data.message || 'Không thể cập nhật lịch nhắc nhở');
      }
    } catch (error) {
      console.log('Update schedule error:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật lịch nhắc nhở');
    }
  };

  const handleAddNew = () => {
    navigation.navigate('GuardianEditor', {
      mode: 'create',
      patient: patient,
    });
  };

  const renderMedicationsByDay = () => {
    const today = dayjs();
    const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = today.add(i, 'day');
      days.push({
        date: date,
        dayName: daysOfWeek[date.day()],
        dayNumber: date.date(),
        isToday: i === 0,
      });
    }

    return days.map((day, index) => {
      const dayMedications = medications.filter(med => {
        if (!med.prescriptionschedule) return false;
        
        // Validate start date and end date
        const today = dayjs();
        const startDate = med.startdate ? dayjs(med.startdate) : null;
        const endDate = med.enddate ? dayjs(med.enddate) : null;
        
        // Skip if prescription hasn't started yet
        if (startDate && today.isBefore(startDate, 'day')) {
          return false;
        }
        
        // Skip if prescription has ended
        if (endDate && today.isAfter(endDate, 'day')) {
          return false;
        }
        
        const schedule = med.prescriptionschedule;
        const repeatPattern = schedule.repeatpattern?.toUpperCase();
        
        if (repeatPattern === 'DAILY') {
          return true;
        } else if (repeatPattern === 'WEEKLY') {
          const dayOfWeek = schedule.dayofweek;
          return dayOfWeek === day.date.day();
        } else if (repeatPattern === 'MONTHLY') {
          const dayOfMonth = schedule.dayofmonth;
          return dayOfMonth === day.dayNumber;
        }
        
        return false;
      });

      return (
        <View key={index} style={styles.daySection}>
          <View style={styles.dayHeader}>
            <View style={[styles.dayBadge, day.isToday && styles.todayBadge]}>
              <Text style={[styles.dayName, day.isToday && styles.todayText]}>
                {day.dayName}
              </Text>
              <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>
                {day.dayNumber}
              </Text>
            </View>
          </View>

          {dayMedications.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>Không có nhắc nhở</Text>
            </View>
          ) : (
            dayMedications.map((medication, medIndex) => (
              <TouchableOpacity 
                key={medIndex}
                onPress={() => handleEditTime(medication)}
                activeOpacity={0.7}
              >
                <MedicationCard
                  name={medication.medicine?.name || 'Không rõ tên'}
                  dosage={medication.dosage || ''}
                  quantity={`${medication.frequencyperday || 1} lần/ngày`}
                  status={medication.status || 'pending'}
                  takenInfo={
                    medication.status === 'taken' && medication.takenAt
                      ? `Đã uống lúc ${medication.takenAt}`
                      : (medication.prescriptionschedule?.timeofday 
                          ? `Uống lúc ${medication.prescriptionschedule.timeofday.substring(0, 5)}` 
                          : '')
                  }
                  onTake={null}
                  onSkip={null}
                  onDelete={() => handleDelete(medication)}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{patient.patientFullname}</Text>
            <Text style={styles.headerSubtitle}>Quản lý nhắc nhở</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddNew}
          >
            <Ionicons name="add-circle" size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.contentPadding}>
          {/* Patient Info Card */}
          <View style={styles.patientInfoCard}>
            <View style={styles.patientAvatar}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.patientFullname}</Text>
              <Text style={styles.patientMeta}>
                ID: {patient.patientid} • Liên kết: {dayjs(patient.createdat).format('DD/MM/YYYY')}
              </Text>
              <Text style={styles.patientMeta}>
                📊 Tổng nhắc nhở: {medications.length}
              </Text>
            </View>
          </View>

          {/* Medications by Day */}
          {loading && medications.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyStateText}>Chưa có nhắc nhở</Text>
              <Text style={styles.emptyStateSubtext}>
                Nhấn nút + để thêm nhắc nhở mới cho bệnh nhân
              </Text>
            </View>
          ) : (
            renderMedicationsByDay()
          )}
        </View>
      </ScrollView>

      {/* Edit Time Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa mốc giờ</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Thời gian nhắc nhở</Text>
              <TimePicker
                value={editingTime}
                onTimeChange={(time) => setEditingTime(time)}
              />
              
              <View style={styles.modalSpacer} />
              
              <Text style={styles.modalLabel}>Tần suất lặp lại</Text>
              <RepeatPatternPicker
                selectedPattern={editingRepeatPattern.pattern}
                interval={editingRepeatPattern.interval}
                dayOfWeek={editingRepeatPattern.dayOfWeek}
                dayOfMonth={editingRepeatPattern.dayOfMonth}
                onPatternChange={(data) => setEditingRepeatPattern(data)}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={updateScheduleTime}
              >
                <Text style={styles.saveButtonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  addButton: {
    padding: 5,
  },
  scrollContent: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
  },
  patientInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  patientMeta: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  daySection: {
    marginBottom: 24,
  },
  dayHeader: {
    marginBottom: 12,
  },
  dayBadge: {
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  todayBadge: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 2,
  },
  todayText: {
    color: Colors.white,
  },
  emptyDay: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  modalSpacer: {
    height: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
