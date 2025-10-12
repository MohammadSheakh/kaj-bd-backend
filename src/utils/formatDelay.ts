//@ts-ignore
import { differenceInMinutes, differenceInSeconds , differenceInHours, differenceInDays, isAfter } from "date-fns";


/********
 * 
 * we use this function to format delay time in milliseconds to a more human-readable format
 * calling this function in add job into bullmq
 * 
 * in doctorPatientScheduleBooking.service.ts
 * in specialistPatientScheduleBooking.service.ts
 * 
 * ***** */
export function formatDelay(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0 && seconds > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} second${seconds > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
}

/**
 * Upcoming Doctor Schedule Of Doctor Dashboard 
 * 
 * Formats how much time is left until a target date.
 * Returns a human-readable string like:
 * "10 minutes left", "After 1 day", "Expired", etc.
 * 
 * we pass startTime in params .. 
 */
export function formatRemainingTime(targetDate: Date): string {
  const now = new Date();

  if (!targetDate || !(targetDate instanceof Date) || isNaN(targetDate.getTime())) {
    return "Invalid date";
  }

  if (!isAfter(targetDate, now)) {
    return "Expired";
  }

  const diffMinutes = differenceInMinutes(targetDate, now);
  const diffHours = differenceInHours(targetDate, now);
  const diffDays = differenceInDays(targetDate, now);

  const totalSeconds = differenceInSeconds(targetDate, now);

  // Less than 60 seconds → show seconds
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds !== 1 ? "s" : ""} left`;
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} left`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} left`;
  }

  return `After ${diffDays} day${diffDays !== 1 ? "s" : ""}`;
}