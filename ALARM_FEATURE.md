# Tính năng Báo thức Âm thanh

## Mô tả
Tính năng báo thức âm thanh cho phép người dùng:
- Chọn nhạc chuông nhắc nhở khi tạo lịch uống thuốc
- Nghe thử các nhạc chuông trước khi chọn
- Tự động phát nhạc chuông khi đến giờ uống thuốc
- Tắt báo thức hoặc báo lại sau 5 phút

## Components mới

### 1. AlarmSoundPicker
**Vị trí**: `src/components/AlarmSoundPicker.js`

Component cho phép người dùng chọn nhạc chuông:
- Hiển thị danh sách 3 nhạc chuông
- Cho phép nghe thử từng nhạc chuông
- Lưu lựa chọn vào state

### 2. AlarmModal
**Vị trí**: `src/components/AlarmModal.js`

Modal hiển thị khi đến giờ báo thức:
- Hiển thị thông tin thuốc cần uống
- Phát nhạc chuông tự động (loop)
- Animation pulse cho icon báo thức
- 2 nút: "Tắt báo thức" và "Báo lại sau 5 phút"

## Services

### alarmService.js
**Vị trí**: `src/services/alarmService.js`

Cung cấp các functions:
- `playAlarmSound(alarmSoundId)` - Phát nhạc chuông
- `stopAlarmSound()` - Dừng nhạc chuông
- `saveAlarmSettings(medicationId, alarmSoundId)` - Lưu cài đặt
- `getAlarmSoundForMedication(medicationId)` - Lấy nhạc chuông đã chọn
- `playAlarmForMedication(medicationId)` - Phát nhạc cho thuốc cụ thể

## Cách sử dụng

### 1. Trong EditorScreen
```javascript
import AlarmSoundPicker from '../components/AlarmSoundPicker';

// Thêm vào state
alarmSound: 'alarm1'

// Thêm vào UI
<AlarmSoundPicker
  selectedSound={medItem.alarmSound}
  onSoundSelect={(sound) => updateMedication(index, 'alarmSound', sound.id)}
/>

// Lưu khi tạo prescription
await saveAlarmSettings(prescriptionId, medItem.alarmSound);
```

### 2. Trong HomeScreen
```javascript
import AlarmModal from '../components/AlarmModal';

// Thêm state
const [alarmMedication, setAlarmMedication] = useState(null);
const [showAlarmModal, setShowAlarmModal] = useState(false);

// Check alarms mỗi phút
useEffect(() => {
  const currentTime = now.format('HH:mm');
  const alarmMeds = data.filter(med => 
    med.time === currentTime && 
    med.status === 'pending'
  );
  if (alarmMeds.length > 0) {
    setAlarmMedication(alarmMeds[0]);
    setShowAlarmModal(true);
  }
}, [now, data]);

// Render modal
<AlarmModal
  visible={showAlarmModal}
  medication={alarmMedication}
  onDismiss={handleAlarmDismiss}
  onSnooze={handleAlarmSnooze}
/>
```

## File âm thanh

**Vị trí**: `assets/sounds/`
- `alarm1.mp3` - Chuông 1
- `alarm2.mp3` - Chuông 2
- `alarm3.mp3` - Chuông 3

## Lưu ý kỹ thuật

1. **expo-av**: Sử dụng thay vì expo-audio để có nhiều tính năng hơn
2. **Loop**: Nhạc chuông sẽ lặp lại cho đến khi người dùng tắt
3. **Volume**: Mặc định 100% cho báo thức, 50% cho preview
4. **Silent mode**: Vẫn phát nhạc ngay cả khi điện thoại ở chế độ im lặng
5. **AsyncStorage**: Lưu cài đặt nhạc chuông offline

## Tính năng tương lai
- [ ] Snooze thực sự (báo lại sau 5 phút)
- [ ] Custom ringtone (cho phép người dùng tải nhạc riêng)
- [ ] Vibration pattern
- [ ] Tăng dần âm lượng (gentle alarm)
