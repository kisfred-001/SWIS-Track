import { OperationalPolicySettings } from '../types';

/**
 * Default Institutional Operational Policies
 * - Disabled by default initially per user instructions
 * - Configurable by Administrator from Setup module
 */
export const DEFAULT_OPERATIONAL_POLICIES: OperationalPolicySettings = {
  schoolHours: {
    enabled: false, // Disabled initially for testing
    mondayToThursday: {
      openTime: '07:00',
      closeTime: '16:30',
      openLabel: '7:00 AM',
      closeLabel: '4:30 PM',
    },
    friday: {
      openTime: '07:00',
      closeTime: '14:00',
      openLabel: '7:00 AM',
      closeLabel: '2:00 PM',
    },
    weekendClosed: true,
  },
  boardingSchedule: {
    enabled: false, // Disabled initially for testing
    campusName: 'Spring Campus',
    dropoffDayName: 'Monday',
    dropoffTime: '07:00',
    dismissalDayName: 'Friday',
    dismissalTime: '14:00',
    notifyMidWeekDepartures: true,
    requireApprovalForMidWeek: true,
  },
  earlyDeparture: {
    enabled: false, // Disabled initially for testing
    monThuDismissalTime: '16:30',
    friDismissalTime: '14:00',
    earlyDepartureBufferMinutes: 10,
    requireAuthorizationNote: true,
    requirePartyDetails: true,
  },
};

/**
 * Format 24-hour time "HH:MM" into 12-hour "h:MM AM/PM"
 */
export const formatTime24to12 = (time24: string): string => {
  if (!time24 || !time24.includes(':')) return time24 || '';
  const [hourStr, minStr] = time24.split(':');
  const h = parseInt(hourStr, 10);
  const m = parseInt(minStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  const displayMinute = m < 10 ? `0${m}` : `${m}`;
  return `${displayHour}:${displayMinute} ${period}`;
};

export interface SchoolScheduleInfo {
  dayName: string; // 'Monday', 'Tuesday', ..., 'Sunday'
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  isSchoolDay: boolean;
  isFriday: boolean;
  openTimeStr: string; // '7:00 AM'
  closeTimeStr: string; // '4:30 PM' or '2:00 PM'
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
  scheduleLabel: string;
  isWithinOperatingHours: boolean;
  statusBadgeText: string;
  isPolicyEnabled: boolean;
}

export const getSchoolSchedule = (
  targetDate: Date = new Date(),
  policies: OperationalPolicySettings = DEFAULT_OPERATIONAL_POLICIES
): SchoolScheduleInfo => {
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayOfWeek];

  const isFriday = dayOfWeek === 5;
  const isMonToThu = dayOfWeek >= 1 && dayOfWeek <= 4;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const schoolHours = policies.schoolHours || DEFAULT_OPERATIONAL_POLICIES.schoolHours;
  const isPolicyEnabled = schoolHours.enabled;

  // If policy is disabled, system operates without schedule restrictions during testing
  if (!isPolicyEnabled) {
    return {
      dayName,
      dayOfWeek,
      isSchoolDay: true,
      isFriday,
      openTimeStr: '7:00 AM',
      closeTimeStr: isFriday ? '2:00 PM' : '4:30 PM',
      openHour: 7,
      openMinute: 0,
      closeHour: isFriday ? 14 : 16,
      closeMinute: isFriday ? 0 : 30,
      scheduleLabel: isFriday
        ? 'Friday Schedule (7:00 AM – 2:00 PM • Unenforced)'
        : 'Mon–Thu Schedule (7:00 AM – 4:30 PM • Unenforced)',
      isWithinOperatingHours: true,
      statusBadgeText: 'System Testing Mode (Schedule Restrictions Disabled)',
      isPolicyEnabled: false,
    };
  }

  const isSchoolDay = (isMonToThu || isFriday) && (!isWeekend || !schoolHours.weekendClosed);

  const activeConfig = isFriday
    ? schoolHours.friday
    : schoolHours.mondayToThursday;

  const [openH, openM] = (activeConfig?.openTime || '07:00').split(':').map(Number);
  const [closeH, closeM] = (activeConfig?.closeTime || (isFriday ? '14:00' : '16:30')).split(':').map(Number);

  const openHour = isNaN(openH) ? 7 : openH;
  const openMinute = isNaN(openM) ? 0 : openM;
  const closeHour = isNaN(closeH) ? (isFriday ? 14 : 16) : closeH;
  const closeMinute = isNaN(closeM) ? (isFriday ? 0 : 30) : closeM;

  const openTimeStr = activeConfig?.openLabel || formatTime24to12(`${openHour}:${openMinute}`);
  const closeTimeStr = activeConfig?.closeLabel || formatTime24to12(`${closeHour}:${closeMinute}`);

  const curHour = targetDate.getHours();
  const curMin = targetDate.getMinutes();
  const curTimeDec = curHour + curMin / 60;
  const openTimeDec = openHour + openMinute / 60;
  const closeTimeDec = closeHour + closeMinute / 60;

  const isWithinOperatingHours = isSchoolDay && curTimeDec >= openTimeDec && curTimeDec <= closeTimeDec;

  let statusBadgeText = '';
  if (!isSchoolDay || isWeekend) {
    statusBadgeText = 'Weekend / School Closed';
  } else if (curTimeDec < openTimeDec) {
    statusBadgeText = `Pre-Opening (Opens at ${openTimeStr})`;
  } else if (curTimeDec > closeTimeDec) {
    statusBadgeText = `After Hours (Dismissed at ${closeTimeStr})`;
  } else {
    statusBadgeText = `Active Hours (${openTimeStr} – ${closeTimeStr})`;
  }

  const scheduleLabel = isWeekend
    ? 'Weekend (Classes Resume Monday 7:00 AM)'
    : isFriday
    ? `Friday Schedule: ${openTimeStr} – ${closeTimeStr}`
    : `Mon–Thu Schedule: ${openTimeStr} – ${closeTimeStr}`;

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
    isPolicyEnabled: true,
  };
};

/**
 * Checks if a departure time is considered early.
 * If Early Departure Enforcement is disabled, this returns false.
 */
export const isEarlyDepartureTime = (
  date: Date = new Date(),
  policies: OperationalPolicySettings = DEFAULT_OPERATIONAL_POLICIES
): boolean => {
  const earlyConfig = policies.earlyDeparture || DEFAULT_OPERATIONAL_POLICIES.earlyDeparture;
  if (!earlyConfig.enabled) {
    return false; // Early departure enforcement is disabled
  }

  const dayOfWeek = date.getDay();
  const isFriday = dayOfWeek === 5;
  const isMonToThu = dayOfWeek >= 1 && dayOfWeek <= 4;
  if (!isMonToThu && !isFriday) return false;

  const dismissalTimeStr = isFriday
    ? (earlyConfig.friDismissalTime || '14:00')
    : (earlyConfig.monThuDismissalTime || '16:30');

  const [closeH, closeM] = dismissalTimeStr.split(':').map(Number);
  const closeHour = isNaN(closeH) ? (isFriday ? 14 : 16) : closeH;
  const closeMinute = isNaN(closeM) ? (isFriday ? 0 : 30) : closeM;

  const curHour = date.getHours();
  const curMin = date.getMinutes();
  const curTimeDec = curHour + curMin / 60;
  const closeTimeDec = closeHour + closeMinute / 60;

  const bufferMinutes = earlyConfig.earlyDepartureBufferMinutes ?? 10;
  return curTimeDec < closeTimeDec - bufferMinutes / 60;
};

/**
 * Helper to check Boarding Schedule status
 */
export const getBoardingScheduleStatus = (
  date: Date = new Date(),
  policies: OperationalPolicySettings = DEFAULT_OPERATIONAL_POLICIES
): {
  isMondayDropoff: boolean;
  isFridayDismissal: boolean;
  isMidWeek: boolean;
  isEnforced: boolean;
  message: string;
} => {
  const boardingConfig = policies.boardingSchedule || DEFAULT_OPERATIONAL_POLICIES.boardingSchedule;
  const day = date.getDay();
  const isMondayDropoff = day === 1;
  const isFridayDismissal = day === 5;
  const isMidWeek = day >= 2 && day <= 4;

  if (!boardingConfig.enabled) {
    return {
      isMondayDropoff,
      isFridayDismissal,
      isMidWeek,
      isEnforced: false,
      message: 'Boarding Policy: Disabled for testing (Full open check-in/out permitted).',
    };
  }

  const dropoffTimeStr = formatTime24to12(boardingConfig.dropoffTime || '07:00');
  const dismissalTimeStr = formatTime24to12(boardingConfig.dismissalTime || '14:00');

  let message = '';
  if (isMondayDropoff) {
    message = `Monday Boarder Drop-off: Students staying on campus until Friday (from ${dropoffTimeStr}).`;
  } else if (isFridayDismissal) {
    message = `Friday Boarder Pick-up: Weekly boarding dismissal (by ${dismissalTimeStr}).`;
  } else if (isMidWeek) {
    message = boardingConfig.notifyMidWeekDepartures
      ? 'Mid-Week Boarding: Student is resident on campus. Mid-week departures trigger resident security alerts & require authorization.'
      : 'Mid-Week Boarding: Student is resident on campus.';
  } else {
    message = `Weekend: Boarding facilities resume Monday at ${dropoffTimeStr}.`;
  }

  return { isMondayDropoff, isFridayDismissal, isMidWeek, isEnforced: true, message };
};
