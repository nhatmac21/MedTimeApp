import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://medtime-be.onrender.com/api';
const CURRENT_USER_KEY = '@medtime_current_user';
const TOKEN_KEY = '@medtime_token';

// API helper function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    // Decode JWT to check user info
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        console.log('=== JWT TOKEN INFO ===');
        console.log('User ID from token:', payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
        console.log('Username from token:', payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']);
        console.log('Role from token:', payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
        console.log('Token expires:', new Date(payload.exp * 1000));
      } catch (e) {
        console.log('Could not decode JWT:', e);
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Only add Authorization header if token exists and is valid
    if (token && token !== 'undefined' && token !== 'null') {
      headers.Authorization = `Bearer ${token}`;
    }

    const requestUrl = `${API_BASE_URL}${endpoint}`;
    const requestOptions = {
      ...options,
      headers,
    };

    console.log('=== API REQUEST ===');
    console.log('URL:', requestUrl);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', headers);
    console.log('Body:', options.body);

    const response = await fetch(requestUrl, requestOptions);

    console.log('=== API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    // Check if response is ok first
    if (!response.ok) {
      console.log('Response not OK:', response.status);
      if (response.status === 401) {
        return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
      } else if (response.status === 403) {
        return { success: false, error: 'Bạn không có quyền thực hiện thao tác này' };
      } else if (response.status === 400) {
        // Try to get error details for 400
        try {
          const errorData = await response.json();
          console.log('400 Error Data:', errorData);
          return { success: false, error: errorData.message || 'Thông tin không hợp lệ' };
        } catch {
          return { success: false, error: 'Thông tin không hợp lệ' };
        }
      } else if (response.status >= 500) {
        return { success: false, error: 'Lỗi máy chủ, vui lòng thử lại sau' };
      } else {
        return { success: false, error: 'Đã xảy ra lỗi, vui lòng thử lại' };
      }
    }

    // Try to parse JSON
    let data;
    try {
      const responseText = await response.text();
      console.log('Response Text:', responseText);
      data = JSON.parse(responseText);
      console.log('Parsed Data:', data);
    } catch (parseError) {
      console.log('Parse Error:', parseError);
      return { success: false, error: 'Lỗi phản hồi từ máy chủ' };
    }
    
    // Backend returns success field in response
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.message || 'Đăng nhập thất bại' };
    }
  } catch (error) {
    // Network or other errors
    if (error.name === 'TypeError' && error.message.includes('Network')) {
      return { success: false, error: 'Không thể kết nối đến máy chủ' };
    }
    return { success: false, error: 'Vui lòng kiểm tra lại tài khoản hoặc mật khẩu' };
  }
};

// Register new user
export const registerUser = async (username, password, confirmPassword) => {
  try {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        userName: username,
        password: password,
        confirmPassword: confirmPassword,
      }),
    });

    if (result.success) {
      return { success: true, message: 'Đăng ký thành công!' };
    } else {
      return { success: false, error: result.error || 'Đăng ký thất bại, vui lòng thử lại' };
    }
  } catch (error) {
    return { success: false, error: 'Đăng ký thất bại, vui lòng thử lại' };
  }
};

// Login user
export const loginUser = async (username, password) => {
  try {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        userName: username,
        password: password,
      }),
    });

    if (result.success) {
      const responseData = result.data;
      
      // Extract token and user from backend response
      const accessToken = responseData.accessToken;
      const refreshToken = responseData.refreshToken;
      const user = responseData.user;
      
      if (accessToken && user) {
        // Save tokens and user info
        await AsyncStorage.setItem(TOKEN_KEY, accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('@medtime_refresh_token', refreshToken);
        }
        
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify({
          id: user.userid.toString(),
          username: user.userName,
          fullname: user.fullname,
          email: user.email,
          phone: user.phonenumber,
          isPremium: user.ispremium || false,
          role: user.role,
          timezone: user.timezone,
          premiumStart: user.premiumstart,
          premiumEnd: user.premiumend,
          uniquecode: user.uniquecode,
          loginTime: new Date().toISOString(),
        }));
        
        return { success: true };
      } else {
        return { success: false, error: 'Vui lòng kiểm tra lại tài khoản hoặc mật khẩu' };
      }
    } else {
      return { success: false, error: result.error || 'Vui lòng kiểm tra lại tài khoản hoặc mật khẩu' };
    }
  } catch (error) {
    return { success: false, error: 'Vui lòng kiểm tra lại tài khoản hoặc mật khẩu' };
  }
};

// Get current logged in user
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.log('Error getting current user:', error);
    return null;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (error) {
    console.log('Error logging out:', error);
    return false;
  }
};

// Check if user is logged in
export const isLoggedIn = async () => {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    // Just check if user data exists (token is optional)
    return userData !== null;
  } catch (error) {
    console.log('Error checking login status:', error);
    return false;
  }
};

// Update user premium status
export const updateUserPremium = async (isPremium) => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    const result = await apiRequest('/auth/update-premium', {
      method: 'PUT',
      body: JSON.stringify({ isPremium }),
    });

    if (result.success) {
      // Update local user session
      const updatedUser = { ...currentUser, isPremium };
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      return true;
    }

    return false;
  } catch (error) {
    console.log('Error updating premium status:', error);
    return false;
  }
};

// Get auth token for API requests
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.log('Error getting auth token:', error);
    return null;
  }
};

// Get refresh token
export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem('@medtime_refresh_token');
  } catch (error) {
    console.log('Error getting refresh token:', error);
    return null;
  }
};

// Check if user is premium
export const isUserPremium = async () => {
  try {
    const user = await getCurrentUser();
    return user?.isPremium || false;
  } catch (error) {
    console.log('Error checking premium status:', error);
    return false;
  }
};

// Get user info from backend API
export const getUserInfo = async () => {
  try {
    const result = await apiRequest('/user/me', {
      method: 'GET',
    });

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể lấy thông tin người dùng' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

// Update user info to backend API
export const updateUserInfo = async (userId, userData) => {
  try {
    const result = await apiRequest(`/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        fullname: userData.fullname,
        email: userData.email,
        phonenumber: userData.phonenumber,
        dateofbirth: userData.dateofbirth,
        gender: userData.gender,
        timezone: userData.timezone || 'string'
      }),
    });

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể cập nhật thông tin người dùng' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

// Guardian Link API functions
export const linkGuardian = async (uniquecode) => {
  try {
    const result = await apiRequest('/guardianlink', {
      method: 'POST',
      body: JSON.stringify({ uniquecode }),
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể liên kết với người giám sát' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

export const getGuardianLinks = async () => {
  try {
    const result = await apiRequest('/guardianlink', {
      method: 'GET',
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể tải danh sách người giám sát' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

// Prescription API functions
export const getPrescriptions = async (pageNumber = 1, pageSize = 20) => {
  try {
    const result = await apiRequest(`/prescription?PageNumber=${pageNumber}&PageSize=${pageSize}`, {
      method: 'GET',
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể tải danh sách thuốc' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

export const getPrescriptionSchedules = async (pageNumber = 1, pageSize = 20) => {
  try {
    const result = await apiRequest(`/prescriptionschedule?PageNumber=${pageNumber}&PageSize=${pageSize}`, {
      method: 'GET',
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể tải lịch trình thuốc' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

export const createPrescriptionSchedule = async (scheduleData) => {
  try {
    const result = await apiRequest('/prescriptionschedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể tạo lịch trình' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

export const updatePrescriptionSchedule = async (scheduleId, scheduleData) => {
  try {
    console.log('=== API UPDATE PRESCRIPTION SCHEDULE ===');
    console.log('Schedule ID:', scheduleId);
    console.log('Original Schedule Data:', scheduleData);
    
    // Format data for prescription schedule API
    const apiData = {
      timeofday: scheduleData.timeofday || "08:00",
      interval: scheduleData.interval || 1,
      dayofmonth: scheduleData.dayofmonth || null,
      repeatPattern: scheduleData.repeatPattern || "daily",
      dayOfWeek: scheduleData.dayOfWeek || null,
      notificationenabled: scheduleData.notificationenabled !== false,
      customringtone: scheduleData.customringtone || null
    };
    
    console.log('Formatted API Data:', apiData);
    console.log('Request URL:', `/prescriptionschedule/${scheduleId}`);
    
    const result = await apiRequest(`/prescriptionschedule/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(apiData),
    });
    
    console.log('API Raw Result:', result);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể cập nhật lịch trình' };
    }
  } catch (error) {
    console.log('API Catch Error:', error);
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

export const createPrescription = async (prescriptionData) => {
  try {
    const result = await apiRequest('/prescription', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể tạo nhắc nhở' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

export const updatePrescription = async (prescriptionId, prescriptionData) => {
  try {
    console.log('=== UPDATE PRESCRIPTION ===');
    console.log('Prescription ID:', prescriptionId);
    console.log('Prescription Data:', prescriptionData);
    
    const result = await apiRequest(`/prescription/${prescriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(prescriptionData),
    });
    
    console.log('Update Result:', result);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể cập nhật nhắc nhở' };
    }
  } catch (error) {
    console.log('Update Error:', error);
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

export const deletePrescription = async (prescriptionId) => {
  try {
    console.log('=== DELETE PRESCRIPTION ===');
    console.log('Prescription ID:', prescriptionId);
    
    const result = await apiRequest(`/prescription/${prescriptionId}`, {
      method: 'DELETE',
    });
    
    console.log('Delete Result:', result);
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Không thể xóa nhắc nhở' };
    }
  } catch (error) {
    console.log('Delete Error:', error);
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};

// Medicine API functions
export const getMedicines = async (pageNumber = 1, pageSize = 50) => {
  try {
    const result = await apiRequest(`/medicine?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
      method: 'GET',
    });
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Không thể tải danh sách thuốc' };
    }
  } catch (error) {
    return { success: false, error: 'Lỗi kết nối, vui lòng thử lại' };
  }
};