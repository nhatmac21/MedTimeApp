import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://medtime-be.onrender.com/api';
const CURRENT_USER_KEY = '@medtime_current_user';
const TOKEN_KEY = '@medtime_token';

// API helper function
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Only add Authorization header if token exists and is valid
    if (token && token !== 'undefined' && token !== 'null') {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is ok first
    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
      } else if (response.status === 400) {
        return { success: false, error: 'Thông tin không hợp lệ' };
      } else if (response.status >= 500) {
        return { success: false, error: 'Lỗi máy chủ, vui lòng thử lại sau' };
      } else {
        return { success: false, error: 'Đã xảy ra lỗi, vui lòng thử lại' };
      }
    }

    // Try to parse JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
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