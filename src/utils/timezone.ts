import { DateTime } from 'luxon';

export const toLocalTime = (date: Date | string | null, zone: string = 'Asia/Dhaka'): string | null => {
  if (!date) return null;
  return DateTime.fromJSDate(new Date(date))
    .setZone(zone)
    .toFormat("yyyy-MM-dd'T'HH:mm:ss");
};

export const toUTCTime = (dateString: Date | string, zone: string = 'Asia/Dhaka'): Date => {
  return DateTime.fromISO(dateString, { zone })
    .toUTC()
    .toJSDate();
};