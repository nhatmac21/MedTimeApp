import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export const fmtTime = (isoOrDate) => dayjs(isoOrDate).format('H:mm');
export const fmtDate = (isoOrDate) => dayjs(isoOrDate).format('dddd, [tháng] M, YYYY');

export const getWeekDays = (baseDate = dayjs()) => {
  const start = baseDate.startOf('week'); // tuần bắt đầu CN theo locale vi
  return Array.from({ length: 7 }).map((_, i) => {
    const d = start.add(i, 'day');
    return {
      key: d.format('YYYY-MM-DD'),
      date: d,
      label: d.format('DD'),
      weekday: d.format('dd'), // CN, T2...
      isToday: d.isSame(dayjs(), 'day'),
    };
  });
};

export const isPastTimeToday = (timeStr) => {
  // timeStr: '08:00'
  const [h, m] = timeStr.split(':').map(Number);
  const now = dayjs();
  const t = now.hour(h).minute(m).second(0);
  return t.isBefore(now);
};

export const nowIso = () => dayjs().toISOString();
