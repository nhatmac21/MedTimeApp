// API tạm thời (mock). Có thể thay bằng fetch tới server thật.
// Mỗi loại thuốc có lịch trong ngày với giờ cụ thể.

export async function fetchMedicationsForDate(dateKey) {
  // dateKey: 'YYYY-MM-DD' (dùng để sau này gọi API theo ngày)
  await new Promise((r) => setTimeout(r, 300)); // giả lập network
  return [
    {
      id: 'amlodipine',
      name: 'Amlodipine',
      dosage: '100mg',
      times: [
        { time: '08:00', quantity: 2, status: 'taken', takenAt: '08:00' },
      ],
    },
    {
      id: 'omega3-morning',
      name: 'Omega - 3',
      dosage: '100mg',
      times: [
        { time: '08:00', quantity: 1, status: 'skipped', note: 'Bỏ qua lúc 8:00' },
      ],
    },
    {
      id: 'omega3-noon',
      name: 'Omega - 3',
      dosage: '100mg',
      times: [
        { time: '12:00', quantity: 1, status: 'taken', takenAt: '12:30', repeats: 2 },
      ],
    },
  ];
}

export async function markDose({ medId, time, status, takenAt, note }) {
  // Gửi patch lên server; hiện tạm trả về ok
  await new Promise((r) => setTimeout(r, 150));
  return { ok: true };
}
