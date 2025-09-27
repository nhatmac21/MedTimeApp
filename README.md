# MedTime (React Native + Expo)

Ứng dụng nhắc nhở uống thuốc bằng tiếng Việt. Giao diện và nhóm dữ liệu giống thiết kế mẫu, thời gian hiển thị theo thời gian thực, không fix cứng.

## Tính năng
- Trang chủ hiển thị tuần hiện tại, các mốc giờ trong ngày, danh sách thuốc theo từng mốc.
- Trạng thái: đã uống, bỏ qua, hoặc chờ.
- Nhắc nhở bằng thông báo cục bộ (Expo Notifications) theo múi giờ máy.
- Kiến trúc thư mục rõ ràng, dễ maintain.

## Cấu trúc thư mục chính
```
src/
  components/ (DayCarousel, MedicationCard, SectionHeader)
  screens/ (Home, Editor, Search, Community)
  navigation/ (RootNavigator)
  services/ (medicationsApi - mock, notifications)
  hooks/ (useClock)
  utils/ (date helpers + dayjs vi)
  theme/ (colors)
```

## Cài đặt & chạy (Windows PowerShell)

```powershell
# Cài dependencies
npm install

# Chạy ứng dụng (mở Expo dev tools)
npm run start

# Mở Android emulator/Expo Go
npm run android

# Hoặc iOS (nếu đang dùng macOS)
# npm run ios
```

Lần đầu chạy, app sẽ hỏi quyền gửi thông báo. Hãy cho phép để nhận nhắc nhở.

## Thay API thật
- Sửa `src/services/medicationsApi.js` để gọi server thực.
- Đảm bảo trả về cấu trúc:
```js
[
  { id, name, dosage, times: [ { time: 'HH:mm', quantity: number, status?: 'taken'|'skipped'|'pending', takenAt?: 'HH:mm' } ] }
]
```

## Ghi chú
- Đây là bản nền tảng tối giản, đủ cho demo giao diện và luồng chính. Có thể bổ sung DB local (AsyncStorage/SQLite), đồng bộ cloud, và màn hình chi tiết thuốc.
