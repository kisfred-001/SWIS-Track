/**
 * Official School Schedule and Operating Hours
 * Spirit & Word International School
 * 
 * Rules:
 * - Days: Monday to Friday
 * - Monday - Thursday: 07:00 AM to 04:30 PM (16:30)
 * - Friday: 07:00 AM to 02:00 PM (14:00)
 * - Saturday & Sunday: Closed / Weekend
 * - Springs Campus Boarding Section: Drop off Monday morning (from 7:00 AM) and departure Friday afternoon (by 2:00 PM).
 */

export interface SchoolScheduleInfo {
  dayName: string; // 'Monday', 'Tuesday', ..., 'Sunday'
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  isSchoolDay: boolean;
  isFriday: boolean;
  openTimeStr: string; // '07:00 AM'
  closeTimeStr: string; // '04:30 PM' or '02:00 PM'
  openHour: number; // 7
  openMinute: number; // 0
  closeHour: number; // 16 or 14
  closeMinute: number; // 30 or 0
  scheduleLabel: string;
  isWithinOperatingHours: boolean;
  statusBadgeText: string;
}

export const getSchoolSchedule = (targetDate: Date = new Date()): SchoolScheduleInfo => {
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayOfWeek];

  const isFriday = dayOfWeek === 5;
  const isMonToThu = dayOfWeek >= 1 && dayOfWeek <= 4;
  const isSchoolDay = isMonToThu || isFriday;

  const openHour = 7;
  const openMinute = 0;
  const openTimeStr = '07:00 AM';

  const closeHour = isFriday ? 14 : 16;
  const closeMinute = isFriday ? 0 : 30;
  const closeTimeStr = isFriday ? '02:00 PM' : '04:30 PM';

  const curHour = targetDate.getHours();
  const curMin = targetDate.getMinutes();
  const curTimeDec = curHour + curMin / 60;
  const openTimeDec = openHour + openMinute / 60;
  const closeTimeDec = closeHour + closeMinute / 60;

  const isWithinOperatingHours = isSchoolDay && curTimeDec >= openTimeDec && curTimeDec <= closeTimeDec;

  let statusBadgeText = '';
  if (!isSchoolDay) {
    statusBadgeText = 'Weekend / School Closed';
  } else if (curTimeDec < openTimeDec) {
    statusBadgeText = `Pre-Opening (Opens at ${openTimeStr})`;
  } else if (curTimeDec > closeTimeDec) {
    statusBadgeText = `After Hours (Dismissed at ${closeTimeStr})`;
  } else {
    statusBadgeText = `Active Hours (${openTimeStr} – ${closeTimeStr})`;
  }

  const scheduleLabel = isFriday
    ? 'Friday Schedule: 7:00 AM – 2:00 PM'
    : isMonToThu
    ? 'Mon–Thu Schedule: 7:00 AM – 4:30 PM'
    : 'Weekend (Classes Resume Monday 7:00 AM)';

  return {
    dayName,
    dayOfWeek,
    isSchoolDay,
    isFriday,
    openTimeStr,
    closeTimeStr,
    openHour,
    openMinute,
    closeHour,
    closeMinute,
    scheduleLabel,
    isWithinOperatingHours,
    statusBadgeText,
  };
};

/**
 * Checks if a student or staff departure time is considered early.
 * Early departure = Check-out before closing time for that day:
 * - Mon-Thu: before 16:30 (4:30 PM)
 * - Fri: before 14:00 (2:00 PM)
 */
export const isEarlyDepartureTime = (date: Date = new Date()): boolean => {
  const schedule = getSchoolSchedule(date);
  if (!schedule.isSchoolDay) return false;

  const curHour = date.getHours();
  const curMin = date.getMinutes();
  const curTimeDec = curHour + curMin / 60;
  const closeTimeDec = schedule.closeHour + schedule.closeMinute / 60;

  // Departing more than 10 minutes prior to scheduled closing time is early departure
  return curTimeDec < closeTimeDec - 10 / 60;
};

/**
 * Checks if staff check-in is after standard opening time (07:00 AM)
 */
export const isStaffLateArrival = (date: Date = new Date()): boolean => {
  const curHour = date.getHours();
  const curMin = date.getMinutes();
  // Staff are expected by 07:00 AM
  return curHour > 7 || (curHour === 7 && curMin > 15);
};

/**
 * Helper to check if today is Monday (for Boarding Drop-off) or Friday (for Boarding Pick-up)
 */
export const getBoardingScheduleStatus = (date: Date = new Date()): {
  isMondayDropoff: boolean;
  isFridayDismissal: boolean;
  message: string;
} => {
  const day = date.getDay();
  const isMondayDropoff = day === 1;
  const isFridayDismissal = day === 5;

  let message = '';
  if (isMondayDropoff) {
    message = 'Monday Boarder Drop-off: Students staying on campus until Friday.';
  } else if (isFridayDismissal) {
    message = 'Friday Boarder Pick-up: Weekly boarding departure (by 2:00 PM).';
  } else if (day >= 2 && day <= 4) {
    message = 'Mid-Week Boarding: Student is resident on campus. Early checkout requires approval.';
  } else {
    message = 'Weekend: Boarding facilities resume Monday at 7:00 AM.';
  }

  return { isMondayDropoff, isFridayDismissal, message };
};
