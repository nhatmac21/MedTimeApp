import { loadMedications } from './storage';
import { getAuthToken } from './auth';
import dayjs from 'dayjs';

const API_BASE_URL = 'https://medtime-be.onrender.com/api';

// API helper function with authentication
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      'accept': '*/*',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return { success: true, data: data.data };
    } else {
      throw new Error(data.message || 'API request failed');
    }
  } catch (error) {
    console.log('API Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Helper function to categorize medicine types
const getTypeCategory = (type) => {
  const categories = {
    'TABLET': 'Viên nén',
    'CAPSULE': 'Viên nang',
    'INJECTION': 'Tiêm',
    'SYRUP': 'Siro',
    'CREAM': 'Kem bôi',
    'OINTMENT': 'Thuốc mỡ',
    'DROPS': 'Thuốc nhỏ',
    'INHALER': 'Dạng hít',
  };
  return categories[type] || 'Khác';
};

// Fetch medicines from backend
export async function fetchMedicinesFromBackend(pageNumber = 1, pageSize = 50) {
  try {
    const result = await apiRequest(`/medicine?PageNumber=${pageNumber}&PageSize=${pageSize}`);
    
    if (result.success) {
      return {
        success: true,
        medicines: result.data.items.map(item => ({
          id: item.medicineid.toString(),
          name: item.name,
          strength: `${item.strengthvalue}${item.strengthUnit}`,
          type: item.type,
          imageUrl: item.imageurl,
          notes: item.notes,
          category: getTypeCategory(item.type),
          strengthvalue: item.strengthvalue,
          strengthUnit: item.strengthUnit,
        })),
        pagination: {
          pageNumber: result.data.pageNumber,
          pageSize: result.data.pageSize,
          totalCount: result.data.totalCount,
          totalPages: result.data.totalPages,
          hasPreviousPage: result.data.hasPreviousPage,
          hasNextPage: result.data.hasNextPage,
        }
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể tải danh sách thuốc từ server' };
  }
}

// Fetch ALL medicines from backend by loading all pages
export async function fetchAllMedicinesFromBackend(pageSize = 50) {
  try {
    console.log('=== LOADING ALL MEDICINES ===');
    
    // First, get the first page to know total pages
    const firstPageResult = await fetchMedicinesFromBackend(1, pageSize);
    
    if (!firstPageResult.success) {
      return { success: false, error: firstPageResult.error };
    }
    
    const { totalPages } = firstPageResult.pagination;
    console.log(`Total pages: ${totalPages}`);
    
    // If only 1 page, return immediately
    if (totalPages <= 1) {
      console.log(`✅ Loaded ${firstPageResult.medicines.length} medicines (1 page)`);
      return {
        success: true,
        medicines: firstPageResult.medicines,
        totalCount: firstPageResult.pagination.totalCount
      };
    }
    
    // Load remaining pages
    const allMedicines = [...firstPageResult.medicines];
    const pagePromises = [];
    
    for (let page = 2; page <= totalPages; page++) {
      console.log(`Loading page ${page}/${totalPages}...`);
      pagePromises.push(fetchMedicinesFromBackend(page, pageSize));
    }
    
    // Wait for all pages to load
    const results = await Promise.all(pagePromises);
    
    // Merge all results
    results.forEach((result, index) => {
      if (result.success) {
        allMedicines.push(...result.medicines);
        console.log(`✅ Loaded page ${index + 2}/${totalPages}: ${result.medicines.length} items`);
      } else {
        console.error(`❌ Failed to load page ${index + 2}:`, result.error);
      }
    });
    
    console.log(`✅ Total medicines loaded: ${allMedicines.length}`);
    
    return {
      success: true,
      medicines: allMedicines,
      totalCount: allMedicines.length
    };
  } catch (error) {
    console.error('Error loading all medicines:', error);
    return { success: false, error: 'Không thể tải toàn bộ danh sách thuốc' };
  }
}

// Search medicines from backend - fallback to client-side search
export async function searchMedicinesFromBackend(searchTerm, pageNumber = 1, pageSize = 20) {
  try {
    // First try to search with backend API (if supported)
    const result = await apiRequest(`/medicine?name=${encodeURIComponent(searchTerm)}&pageNumber=${pageNumber}&pageSize=${pageSize}`);
    
    if (result.success) {
      return {
        success: true,
        medicines: result.data.items.map(item => ({
          id: item.medicineid.toString(),
          name: item.name,
          strength: `${item.strengthvalue}${item.strengthUnit}`,
          type: item.type,
          imageUrl: item.imageurl,
          notes: item.notes,
          category: getTypeCategory(item.type),
        })),
        pagination: {
          pageNumber: result.data.pageNumber,
          totalCount: result.data.totalCount,
          hasNextPage: result.data.hasNextPage,
        }
      };
    } else {
      throw new Error('Backend search not supported');
    }
  } catch (error) {
    // Fallback to client-side search using all medicines
    console.log('Backend search failed, using client-side search');
    return await searchMedicinesClientSide(searchTerm, pageNumber, pageSize);
  }
}

// Client-side search fallback
async function searchMedicinesClientSide(searchTerm, pageNumber = 1, pageSize = 20) {
  try {
    // Get all medicines from backend
    const result = await fetchMedicinesFromBackend(1, 100); // Get more items for search
    
    if (result.success) {
      // Filter medicines on client side
      const filteredMedicines = result.medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (medicine.notes && medicine.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      // Apply pagination
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = filteredMedicines.slice(startIndex, endIndex);

      return {
        success: true,
        medicines: paginatedResults,
        pagination: {
          pageNumber: pageNumber,
          totalCount: filteredMedicines.length,
          hasNextPage: endIndex < filteredMedicines.length,
        }
      };
    } else {
      return { success: false, error: 'Không thể tìm kiếm thuốc' };
    }
  } catch (error) {
    return { success: false, error: 'Không thể tìm kiếm thuốc' };
  }
}

// Fallback function for local medications (keeping existing functionality)
export async function fetchMedicationsForDate(dateKey) {
  const storedMeds = await loadMedications();
  
  return storedMeds.map(med => ({
    ...med,
    times: med.times.map(time => ({
      ...time,
      status: time.status || 'pending'
    }))
  }));
}

// Add new medicine to backend
export async function addMedicineToBackend(medicineData) {
  try {
    const result = await apiRequest('/medicine', {
      method: 'POST',
      body: JSON.stringify(medicineData),
    });

    if (result.success) {
      return {
        success: true,
        medicine: {
          id: result.data.medicineid.toString(),
          name: result.data.name,
          strength: `${result.data.strengthvalue}${result.data.strengthUnit}`,
          type: result.data.type,
          imageUrl: result.data.imageurl,
          notes: result.data.notes,
          category: getTypeCategory(result.data.type),
        }
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: 'Không thể thêm thuốc mới' };
  }
}

export async function markDose({ medId, time, status, takenAt, note }) {
  // TODO: Implement API call to mark dose status
  await new Promise((r) => setTimeout(r, 150));
  return { ok: true };
}
