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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import MedicationCard from '../components/MedicationCard';
import { getAuthToken, getMedicines } from '../services/auth';

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
        console.log('Medicine map created:', Object.keys(medicineMap).length, 'medicines');
        console.log('Sample medicine fields:', Object.keys(medicineMap[1] || {}));
        console.log('Sample medicine full:', medicineMap[1]);
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

        console.log(`Prescription ${prescription.prescriptionid}: medicineid=${prescription.medicineid}, medicine=`, medicine);

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
          });
        }
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
      `Bạn có chắc chắn muốn xóa nhắc nhở "${medication.medicine?.medicinename || 'thuốc này'}"?`,
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
              <MedicationCard
                key={medIndex}
                name={medication.medicine?.medicinename || 'Không rõ tên'}
                dosage={medication.dosage || ''}
                quantity={`${medication.frequencyperday || 1} lần/ngày`}
                status="pending"
                takenInfo={medication.prescriptionschedule?.timeofday ? `Uống lúc ${medication.prescriptionschedule.timeofday.substring(0, 5)}` : ''}
                onTake={null}
                onSkip={null}
                onDelete={() => handleDelete(medication)}
              />
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
});
