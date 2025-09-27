import { loadMedications } from './storage';
import dayjs from 'dayjs';

// API đọc từ AsyncStorage thay vì mock data
export async function fetchMedicationsForDate(dateKey) {
  // dateKey: 'YYYY-MM-DD' 
  await new Promise((r) => setTimeout(r, 100)); // giả lập network delay
  
  const storedMeds = await loadMedications();
  
  // Nếu chưa có thuốc nào được lưu, trả về data mẫu để demo
  if (storedMeds.length === 0) {
    return [
      {
        id: 'demo-amlodipine',
        name: 'Amlodipine',
        dosage: '5mg',
        times: [
          { time: '08:00', quantity: 1, status: 'taken', takenAt: '08:00' },
        ],
      },
      {
        id: 'demo-omega3-morning',
        name: 'Omega-3',
        dosage: '1000mg',
        times: [
          { time: '08:00', quantity: 1, status: 'skipped', note: 'Bỏ qua lúc 8:00' },
        ],
      },
      {
        id: 'demo-omega3-noon',
        name: 'Omega-3',
        dosage: '1000mg',
        times: [
          { time: '12:00', quantity: 1, status: 'taken', takenAt: '12:30', repeats: 2 },
        ],
      },
    ];
  }

  // Trả về thuốc đã lưu với trạng thái mặc định là 'pending'
  return storedMeds.map(med => ({
    ...med,
    times: med.times.map(time => ({
      ...time,
      status: time.status || 'pending'
    }))
  }));
}

export async function markDose({ medId, time, status, takenAt, note }) {
  // Gửi patch lên server; hiện tạm trả về ok
  await new Promise((r) => setTimeout(r, 150));
  return { ok: true };
}
