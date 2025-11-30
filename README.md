# 💊 MedTime - Ứng dụng Nhắc nhở Uống Thuốc

<div align="center">

**Ứng dụng di động nhắc nhở uống thuốc thông minh với giao diện thân thiện bằng tiếng Việt**

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)](https://expo.dev/)
[![License](https://img.shields.io/badge/license-0BSD-green.svg)](LICENSE)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Kiến trúc ứng dụng](#-kiến-trúc-ứng-dụng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt](#-cài-đặt)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [API Integration](#-api-integration)
- [Screenshots](#-screenshots)
- [Đóng góp](#-đóng-góp)
- [License](#-license)

---

## 🎯 Giới thiệu

**MedTime** là ứng dụng di động giúp người dùng quản lý lịch uống thuốc một cách khoa học và hiệu quả. Ứng dụng cung cấp giao diện trực quan, dễ sử dụng với đầy đủ tính năng từ nhắc nhở, theo dõi lịch sử, đến quản lý tài khoản Premium.

### 🎨 Đặc điểm nổi bật

- ✅ **100% tiếng Việt** - Giao diện thân thiện với người dùng Việt Nam
- ⏰ **Nhắc nhở thông minh** - Báo thức với 12 nhạc chuông tùy chọn
- 📊 **Theo dõi chi tiết** - Lịch sử uống thuốc, thống kê tuân thủ
- 🔔 **Thông báo đẩy** - Nhắc nhở kịp thời ngay cả khi app đóng
- 💎 **Hệ thống Premium** - Nâng cấp để mở khóa tính năng cao cấp
- 👨‍👩‍👧‍👦 **Chế độ giám hộ** - Cho phép người thân theo dõi

---

## ✨ Tính năng chính

### 🏠 Trang chủ
- Hiển thị lịch uống thuốc theo ngày/tuần
- Carousel chọn ngày với giao diện đẹp mắt
- Danh sách thuốc theo từng mốc giờ trong ngày
- Trạng thái: Đã uống ✅ | Bỏ qua ⏭️ | Chờ ⏰
- Đồng hồ thời gian thực hiển thị giờ hiện tại
- Đánh dấu nhanh "Đã uống" với một chạm

### 📝 Quản lý đơn thuốc
- Thêm/sửa/xóa thông tin thuốc
- Tìm kiếm thuốc từ database backend (tải toàn bộ danh sách)
- Tùy chỉnh liều lượng, số lượng viên
- Thiết lập lịch trình: Hàng ngày, X ngày/lần, Hàng tuần, Hàng tháng
- Chọn nhạc chuông báo thức (12 lựa chọn)
- Thiết lập thời gian bắt đầu/kết thúc

### 🔔 Hệ thống nhắc nhở
- **Báo thức toàn màn hình** khi đến giờ uống thuốc
- **12 nhạc chuông** tùy chỉnh cho từng loại thuốc
- **Thông báo đẩy** với âm thanh alert
- **Không phát nhiều lần** - Tránh spam khi re-render
- Tích hợp expo-av để phát nhạc nền

### 👤 Quản lý tài khoản
- Đăng ký/Đăng nhập với JWT authentication
- Thông tin cá nhân: Tên, Email, SĐT, Ngày sinh, Giới tính
- **DatePicker** chuyên dụng cho ngày sinh (scroll 3 cột)
- **GenderPicker** với icon đẹp mắt
- Refresh token tự động khi khởi động app
- Logout an toàn

### 💎 Premium Features
- Thêm không giới hạn số loại thuốc (Free: 2 thuốc)
- Xem lịch sử thanh toán đầy đủ
- Đồng bộ dữ liệu đa thiết bị
- Báo cáo chi tiết về việc uống thuốc
- Hỗ trợ khách hàng ưu tiên

### 💳 Thanh toán
- Tích hợp PayOS cho thanh toán VNPay/QR
- 3 gói Premium: 1 tháng, 3 tháng, 1 năm
- Kiểm tra trạng thái thanh toán realtime
- Lịch sử giao dịch đầy đủ với trạng thái

### 👨‍👩‍👧‍👦 Chế độ người giám hộ
- Liên kết tài khoản qua mã UniqueCode
- Theo dõi lịch uống thuốc của người thân
- Nhận thông báo khi bỏ qua thuốc

---

## 🏗️ Kiến trúc ứng dụng

### 📐 Mô hình MVC + Service Layer

```
┌─────────────────────────────────────────┐
│            Presentation Layer           │
│     (Screens + Components + Navigation) │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│           Business Logic Layer          │
│    (Hooks + Utils + Theme + Services)   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│            Data Access Layer            │
│  (API Services + AsyncStorage + State)  │
└─────────────────────────────────────────┘
```

### 🔄 State Management
- **React Hooks** (useState, useEffect, useRef)
- **AsyncStorage** cho local persistence
- **JWT Tokens** cho authentication state
- **Navigation state** với React Navigation

---

## 🛠️ Công nghệ sử dụng

### Core Framework
- **React Native** `0.81.4` - Framework chính
- **Expo** `~54.0` - Development platform
- **React** `19.1.0` - UI library

### Navigation
- **@react-navigation/native** `^6.1.17`
- **@react-navigation/bottom-tabs** `^6.5.20`
- **@react-navigation/stack** `^6.4.1`

### UI/UX
- **expo-linear-gradient** `~15.0.7` - Gradient backgrounds
- **@expo/vector-icons** `^15.0.2` - Icon library
- **react-native-safe-area-context** `~5.6.0`
- **react-native-gesture-handler** `~2.28.0`

### Audio & Notifications
- **expo-av** `^16.0.7` - Audio playback
- **expo-notifications** `~0.32.11` - Push notifications
- **expo-audio** `^1.0.13` - Audio system

### Data & Storage
- **@react-native-async-storage/async-storage** `2.2.0`
- **dayjs** `^1.11.13` - Date manipulation (Vietnamese locale)

### Backend Integration
- **REST API** with JWT Bearer authentication
- **PayOS** payment gateway
- **WebSocket** (planned for real-time updates)

---

## 📦 Cài đặt

### Yêu cầu hệ thống
- **Node.js** >= 18.x
- **npm** >= 9.x hoặc **yarn** >= 1.22.x
- **Git** >= 2.x
- **Expo CLI** (cài tự động qua npm)
- **Android Studio** (cho Android) hoặc **Xcode** (cho iOS)

### Bước 1: Clone repository

```powershell
git clone https://github.com/nhatmac21/MedTimeApp.git
cd MedTimeApp/medTime
```

### Bước 2: Cài đặt dependencies

```powershell
npm install
```

### Bước 3: Cấu hình môi trường (Tùy chọn)

Tạo file `.env` nếu cần cấu hình custom:

```env
API_BASE_URL=https://medtime-be.onrender.com/api
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
```

---

## 🚀 Chạy ứng dụng

### Development Mode

```powershell
# Khởi động Expo dev server
npm start

# Hoặc chạy trực tiếp Android
npm run android

# Hoặc chạy iOS (macOS only)
npm run ios

# Hoặc chạy trên web
npm run web
```

### Sử dụng Expo Go (Recommended cho testing)

1. Cài **Expo Go** app trên điện thoại (Android/iOS)
2. Chạy `npm start`
3. Scan QR code từ terminal/browser
4. App sẽ tự động load trên điện thoại

### Build Production

```powershell
# Android APK
expo build:android

# iOS IPA
expo build:ios

# Hoặc sử dụng EAS Build
eas build --platform android
eas build --platform ios
```

---

## 📁 Cấu trúc thư mục

```
medTime/
├── assets/                      # Static assets
│   ├── logo.png                # App logo
│   └── sounds/                 # Alarm sounds
│       ├── alarm1.mp3
│       ├── alarm2.mp3
│       └── ... (alarm12.mp3)
│
├── src/                        # Source code
│   ├── components/             # Reusable UI components
│   │   ├── AlarmModal.js       # Full-screen alarm popup
│   │   ├── AlarmSoundPicker.js # Sound selection modal
│   │   ├── DayCarousel.js      # Week day selector
│   │   ├── DateOfBirthPicker.js # Birth date picker
│   │   ├── GenderPicker.js     # Gender selection modal
│   │   ├── MedicationCard.js   # Medicine display card
│   │   ├── MedicationPicker.js # Medicine search & select
│   │   ├── RepeatPatternPicker.js # Schedule pattern selector
│   │   ├── SectionHeader.js    # Section title header
│   │   └── TimePicker.js       # Time selection modal
│   │
│   ├── hooks/                  # Custom React hooks
│   │   └── useClock.js         # Real-time clock hook
│   │
│   ├── navigation/             # Navigation setup
│   │   ├── AuthNavigator.js    # Login/Register stack
│   │   ├── EditorStackNavigator.js
│   │   ├── MainNavigator.js    # Main app stack
│   │   └── RootNavigator.js    # Tab navigation
│   │
│   ├── screens/                # App screens
│   │   ├── AccountScreen.js    # User profile editor
│   │   ├── CaregiverScreen.js  # Guardian management
│   │   ├── EditorScreen.js     # Add/Edit medication
│   │   ├── HomeScreen.js       # Main medication list
│   │   ├── LoginScreen.js      # Login form
│   │   ├── PaymentHistoryScreen.js # Payment history
│   │   ├── PaymentScreen.js    # Payment checkout
│   │   ├── PremiumScreen.js    # Premium plans
│   │   ├── PrescriptionDetailScreen.js
│   │   ├── RegisterScreen.js   # Registration form
│   │   ├── SearchScreen.js     # Medicine search
│   │   └── SettingsScreen.js   # App settings
│   │
│   ├── services/               # Business logic & API
│   │   ├── alarmService.js     # Alarm sound management
│   │   ├── auth.js             # Authentication & user API
│   │   ├── localNotifications.js # Notification scheduling
│   │   ├── medicationsApi.js   # Medicine & prescription API
│   │   ├── paymentService.js   # Payment integration
│   │   └── storage.js          # AsyncStorage helpers
│   │
│   ├── theme/                  # Design system
│   │   └── colors.js           # Color palette
│   │
│   └── utils/                  # Utility functions
│       └── date.js             # Date formatting helpers
│
├── App.js                      # Root component
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build configuration
├── index.js                    # Entry point
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## 🔌 API Integration

### Backend API Base URL
```
https://medtime-be.onrender.com/api
```

### Authentication Endpoints

#### POST `/auth/register`
```json
{
  "userName": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

#### POST `/auth/login`
```json
{
  "userName": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": { ... }
  }
}
```

#### POST `/auth/refresh-token`
```json
{
  "accessToken": "current_token",
  "refreshToken": "refresh_token"
}
```

### Medicine Endpoints

#### GET `/medicine?pageNumber=1&pageSize=50`
Lấy danh sách thuốc (có pagination)

#### GET `/prescription?PageNumber=1&PageSize=20`
Lấy danh sách đơn thuốc của user

#### POST `/prescription`
```json
{
  "medicineid": 123,
  "dosage": "500mg",
  "frequencyperday": 3,
  "startdate": "2025-01-01",
  "enddate": "2025-01-31",
  "remainingquantity": 90,
  "doctorname": "Dr. Nguyen",
  "notes": "Uống sau ăn"
}
```

#### POST `/prescriptionschedule`
```json
{
  "prescriptionid": 456,
  "timeofday": "08:00:00",
  "interval": 1,
  "repeatPattern": "DAILY",
  "dayOfWeek": null,
  "dayofmonth": null,
  "notificationenabled": true
}
```

### Intake Log Endpoint

#### POST `/intakelog`
```json
{
  "prescriptionid": 456,
  "scheduleid": 789,
  "actiontime": "2025-11-30T08:15:00",
  "action": "TAKEN",
  "confirmedBy": "user",
  "notes": ""
}
```

### Payment Endpoints

#### GET `/payment/plans`
Lấy danh sách gói Premium

#### POST `/payment/create`
```json
{
  "planId": 1
}
```

#### GET `/payment/status?orderId=12345678`
Kiểm tra trạng thái thanh toán

#### GET `/payment/history`
Lấy lịch sử thanh toán

### Guardian Link Endpoints

#### POST `/guardianlink`
```json
{
  "uniquecode": "ABC123"
}
```

#### GET `/guardianlink`
Lấy danh sách liên kết giám hộ

---

## 🎨 Theme & Design System

### Color Palette

```javascript
{
  primary: '#2FA77A',        // Xanh lá chủ đạo
  primaryDark: '#268661',    // Xanh đậm
  primaryLight: '#E8F5F0',   // Xanh nhạt
  accent: '#FFC107',         // Vàng Premium
  success: '#2FA77A',        // Xanh thành công
  warning: '#FFC107',        // Vàng cảnh báo
  danger: '#F44336',         // Đỏ lỗi
  background: '#F5F5F5',     // Nền app
  surface: '#FAFAFA',        // Nền card
  card: '#FFFFFF',           // Card trắng
  textPrimary: '#212121',    // Text chính
  textSecondary: '#757575',  // Text phụ
  textMuted: '#9E9E9E',      // Text mờ
  border: '#E0E0E0',         // Viền
  shadow: '#000000',         // Đổ bóng
}
```

### Typography

- **Header**: 20-24px, Bold
- **Title**: 16-18px, SemiBold
- **Body**: 14-16px, Regular
- **Caption**: 12-14px, Regular

---

## 📸 Screenshots

### Home Screen
- Danh sách thuốc theo giờ
- Carousel chọn ngày
- Đồng hồ thời gian thực
- Trạng thái uống thuốc

### Editor Screen
- Form thêm/sửa thuốc
- Medicine picker với search
- Time picker cho mốc giờ
- Alarm sound picker (12 sounds)
- Repeat pattern picker

### Premium Screen
- 3 gói Premium
- Tính năng so sánh
- Thanh toán PayOS

### Payment History
- Lịch sử giao dịch
- Trạng thái thanh toán
- Tổng kết số liệu

---

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng làm theo các bước sau:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Quy tắc đóng góp

- Code phải follow React Native best practices
- Commit message rõ ràng, có ý nghĩa
- Test kỹ trước khi tạo PR
- Cập nhật README nếu có thay đổi lớn

---

## 🐛 Báo lỗi

Nếu gặp lỗi, vui lòng tạo issue với thông tin:

- Device/Emulator
- OS version (Android/iOS)
- App version
- Steps to reproduce
- Screenshots (nếu có)

---

## 📄 License

Distributed under the 0BSD License. See `LICENSE` for more information.

---

## 👨‍💻 Tác giả

**Nguyen Van Nhat**
- GitHub: [@nhatmac21](https://github.com/nhatmac21)
- Email: nhatmac21@example.com

---

## 🙏 Lời cảm ơn

- **React Native Community** - Framework tuyệt vời
- **Expo Team** - Development platform
- **Backend Team** - API support
- **Design Team** - UI/UX design
- **Testers** - Quality assurance

---

<div align="center">

**⭐ Nếu thấy hữu ích, hãy cho dự án một star! ⭐**

Made with ❤️ in Vietnam

</div>
