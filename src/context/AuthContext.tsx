import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Staff, UserRole } from '../types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { INITIAL_STAFF, SUPER_USER_ACCOUNT, ensureSuperUserAccount, REMOVED_STAFF_NAMES_OR_IDS } from '../firebase/seed';
import { sound } from '../utils/sound';

export const DEFAULT_IDLE_TIMEOUT_MINUTES = 5;

interface AuthContextType {
  currentUser: Staff | null;
  allStaff: Staff[];
  loading: boolean;
  idleTimedOut: boolean;
  setIdleTimedOut: (val: boolean) => void;
  switchUser: (staff: Staff) => void;
  loginWithPin: (pin: string) => boolean;
  loginWithEmailPassword: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: (isIdle?: boolean) => void;
  resetIdleTimer: () => void;
  idleTimeoutMinutes: number;
  setIdleTimeoutMinutes: (mins: number) => void;
  remainingIdleSeconds: number;
  showIdleWarning: boolean;
  superUserCredentials: { email: string; pin: string; name: string };
  // Permissions
  canScanStudents: boolean;
  canScanTeachers: boolean;
  canManageStudents: boolean;
  canManageStaff: boolean;
  canDirectlyEditLogs: boolean;
  canApproveEditRequests: boolean;
  canSubmitEditRequests: boolean;
  canAccessReports: boolean;
  canAccessSetup: boolean;
  isSuperUser: boolean;
  isAdministrative: boolean;
  isSupervisorOrMonitor: boolean;
  isTeacherOnly: boolean;
  isSupportStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allStaff, setAllStaff] = useState<Staff[]>(INITIAL_STAFF);
  // Always require sign-in on system launch (currentUser starts as null)
  const [currentUser, setCurrentUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [idleTimedOut, setIdleTimedOut] = useState<boolean>(false);

  // Inactivity timeout configuration (defaults to 5 minutes)
  const [idleTimeoutMinutes, setIdleTimeoutMinutesState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('swis_idle_timeout_minutes');
      return saved ? Math.max(1, parseInt(saved, 10)) : DEFAULT_IDLE_TIMEOUT_MINUTES;
    } catch {
      return DEFAULT_IDLE_TIMEOUT_MINUTES;
    }
  });

  const [remainingIdleSeconds, setRemainingIdleSeconds] = useState<number>(idleTimeoutMinutes * 60);
  const [showIdleWarning, setShowIdleWarning] = useState<boolean>(false);

  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(Date.now());

  // Ensure Super User account exists in Firestore on load
  useEffect(() => {
    ensureSuperUserAccount().catch(() => {});
  }, []);

  const setIdleTimeoutMinutes = useCallback((mins: number) => {
    const valid = Math.max(1, Math.min(60, mins));
    setIdleTimeoutMinutesState(valid);
    try {
      localStorage.setItem('swis_idle_timeout_minutes', String(valid));
    } catch {
      // ignore
    }
    lastActivityRef.current = Date.now();
    setRemainingIdleSeconds(valid * 60);
    setShowIdleWarning(false);
  }, []);

  // Reset idle timer upon user interaction
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowIdleWarning(false);
    try {
      localStorage.setItem('swis_last_activity', String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  // Explicit or auto sign out
  const logout = useCallback((isIdle: boolean = false) => {
    setCurrentUser(null);
    localStorage.removeItem('edutrack_active_staff_id');
    localStorage.removeItem('swis_last_activity');
    if (isIdle) {
      setIdleTimedOut(true);
      try {
        sound.playError();
      } catch {
        // ignore
      }
    } else {
      setIdleTimedOut(false);
    }
  }, []);

  // Switch user / login
  const switchUser = useCallback((staff: Staff) => {
    setCurrentUser(staff);
    setIdleTimedOut(false);
    resetIdleTimer();
    localStorage.setItem('edutrack_active_staff_id', staff.staff_id);
  }, [resetIdleTimer]);

  const loginWithPin = useCallback((pin: string): boolean => {
    const trimmed = pin.trim();
    if (trimmed === SUPER_USER_ACCOUNT.pin_code) {
      const superUser = allStaff.find((s) => s.staff_id === SUPER_USER_ACCOUNT.staff_id) || SUPER_USER_ACCOUNT;
      switchUser(superUser);
      return true;
    }
    const found = allStaff.find((s) => s.pin_code.trim() === trimmed);
    if (found) {
      switchUser(found);
      return true;
    }
    return false;
  }, [allStaff, switchUser]);

  const loginWithEmailPassword = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPass = pass.trim();

      // Check for Super User credentials (kisfred@gmail.com / P@haneroo@555)
      if (
        (cleanEmail === SUPER_USER_ACCOUNT.email.toLowerCase() || cleanEmail === 'kisfred') &&
        (cleanPass === SUPER_USER_ACCOUNT.password || cleanPass === SUPER_USER_ACCOUNT.pin_code)
      ) {
        try {
          await signInWithEmailAndPassword(auth, SUPER_USER_ACCOUNT.email, SUPER_USER_ACCOUNT.password || 'P@haneroo@555');
        } catch {
          try {
            await createUserWithEmailAndPassword(auth, SUPER_USER_ACCOUNT.email, SUPER_USER_ACCOUNT.password || 'P@haneroo@555');
          } catch {
            // Firebase Auth error fallback: local super user authenticated
          }
        }
        await ensureSuperUserAccount();
        const superUser =
          allStaff.find((s) => s.staff_id === SUPER_USER_ACCOUNT.staff_id) || SUPER_USER_ACCOUNT;
        switchUser(superUser);
        return { success: true };
      }

      // Check other staff accounts by email, username prefix, and password/PIN
      const foundStaff = allStaff.find((s) => {
        const staffEmail = (s.email || '').toLowerCase();
        const usernamePrefix = staffEmail.split('@')[0];
        const isEmailMatch =
          staffEmail === cleanEmail ||
          usernamePrefix === cleanEmail ||
          staffEmail === `${cleanEmail}@spiritandword.ug`;

        const isPassMatch =
          s.password === cleanPass ||
          s.pin_code === cleanPass ||
          (s.password && s.password.trim() === cleanPass);

        return isEmailMatch && isPassMatch;
      });

      if (foundStaff) {
        switchUser(foundStaff);
        return { success: true };
      }

      // Try Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        const match = allStaff.find(
          (s) =>
            s.email.toLowerCase() === cleanEmail ||
            s.email.toLowerCase().split('@')[0] === cleanEmail
        );
        if (match) {
          switchUser(match);
          return { success: true };
        }
      } catch (err: any) {
        // Continue to error return
      }

      return {
        success: false,
        message: 'Invalid credentials. Please verify your username/email and password.',
      };
    },
    [allStaff, switchUser]
  );

  // Subscribe to real-time staff collection in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'staff'),
      (snapshot) => {
        if (!snapshot.empty) {
          const rawList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Staff[];
          const staffList = rawList.filter(
            (s) =>
              !REMOVED_STAFF_NAMES_OR_IDS.has(s.staff_id) &&
              !REMOVED_STAFF_NAMES_OR_IDS.has((s.full_name || '').trim())
          );
          setAllStaff(staffList);
          // If current user is present in the updated list, refresh current user object
          if (currentUser) {
            const found = staffList.find((s) => s.staff_id === currentUser.staff_id);
            if (found) {
              setCurrentUser(found);
            } else if (
              REMOVED_STAFF_NAMES_OR_IDS.has(currentUser.staff_id) ||
              REMOVED_STAFF_NAMES_OR_IDS.has((currentUser.full_name || '').trim())
            ) {
              setCurrentUser(null);
            }
          }
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // System Launch: Always require sign in on launch (do not auto-login from stored session)
  useEffect(() => {
    localStorage.removeItem('edutrack_active_staff_id');
    localStorage.removeItem('swis_last_activity');
    setCurrentUser(null);
  }, []);

  // Activity event listener to reset idle timer
  useEffect(() => {
    if (!currentUser) return;

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle event handling to once every 2.5 seconds
      if (now - lastThrottleRef.current > 2500) {
        lastThrottleRef.current = now;
        resetIdleTimer();
      }
    };

    // Listen only to intentional interaction events (skip high-frequency mousemove/scroll)
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [currentUser, resetIdleTimer]);

  // Inactivity timeout checker interval (optimized: zero unnecessary state updates when active)
  useEffect(() => {
    if (!currentUser) {
      setShowIdleWarning(false);
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeoutMs = idleTimeoutMinutes * 60 * 1000;
      const elapsed = now - lastActivityRef.current;
      const remainingMs = Math.max(0, timeoutMs - elapsed);
      const remainingSecs = Math.ceil(remainingMs / 1000);

      // Inactivity timeout expired -> Auto sign-out and lock terminal
      if (elapsed >= timeoutMs) {
        setShowIdleWarning(false);
        logout(true);
        return;
      }

      // Only trigger re-render state updates when entering or inside the 60s countdown warning zone
      if (remainingSecs <= 60 && remainingSecs > 0) {
        setShowIdleWarning(true);
        setRemainingIdleSeconds(remainingSecs);
      } else {
        setShowIdleWarning((prev) => {
          if (prev) {
            // Dismissed or reset
            return false;
          }
          return false;
        });
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentUser, idleTimeoutMinutes, logout]);

  const role: UserRole | undefined = currentUser?.role;

  const isIcceCoordinator = role === 'ICCE Coordinator';
  const isPrincipal = role === 'Principal';
  const isDirector = role === 'Director';
  const isAdministrator = role === 'Administrator';
  const isAdminAssistant = role === 'Administrative Assistant';
  const isSupervisor = role === 'Supervisor';
  const isMonitor = role === 'Monitor';
  const isSupportStaff = role === 'Support Staff';

  // Administrative accounts: Principal, Director, Administrator, Admin Assistant, ICCE Coordinator
  const isAdministrative = isIcceCoordinator || isPrincipal || isDirector || isAdministrator || isAdminAssistant;
  const isSupervisorOrMonitor = isSupervisor || isMonitor;

  // Strict RBAC requirements:
  // 1. All staff can scan students in/out. Support staff (Miss. Anette Mugala, situated at Hope Campus) ONLY has rights to sign in and out students.
  // 2. Supervisor and Monitor have the EXACT same rights pertaining to the system.
  // 3. Administrative accounts (Mrs. Irene Lulika, Mr. Jaxon Lulika, Mrs. Khasoma Susan, Mrs. Juliet Arinaitwe) have admin rights.
  // 4. ICCE Coordinator (Mr. Fredrick Kariuki) has highest level administrative account and EXCLUSIVELY accesses setup module.
  const canScanStudents = true;
  const canScanTeachers = isAdministrative;
  const canManageStudents = isAdministrative;
  const canManageStaff = isIcceCoordinator || isPrincipal || isDirector || isAdministrator;
  const canDirectlyEditLogs = isIcceCoordinator || isPrincipal || isDirector || isAdministrator;
  const canApproveEditRequests = isAdministrative;
  const canSubmitEditRequests = isSupervisor || isMonitor || isAdministrative;
  const canAccessReports = isAdministrative || isSupervisor || isMonitor;
  const canAccessSetup = isIcceCoordinator; // ONLY ICCE Coordinator
  const isSuperUser = isIcceCoordinator;

  const authContextValue = useMemo<AuthContextType>(
    () => ({
      currentUser,
      allStaff,
      loading,
      idleTimedOut,
      setIdleTimedOut,
      switchUser,
      loginWithPin,
      loginWithEmailPassword,
      logout,
      resetIdleTimer,
      idleTimeoutMinutes,
      setIdleTimeoutMinutes,
      remainingIdleSeconds,
      showIdleWarning,
      superUserCredentials: {
        email: SUPER_USER_ACCOUNT.email,
        pin: SUPER_USER_ACCOUNT.pin_code,
        name: SUPER_USER_ACCOUNT.full_name,
      },
      canScanStudents,
      canScanTeachers,
      canManageStudents,
      canManageStaff,
      canDirectlyEditLogs,
      canApproveEditRequests,
      canSubmitEditRequests,
      canAccessReports,
      canAccessSetup,
      isSuperUser,
      isAdministrative,
      isSupervisorOrMonitor,
      isTeacherOnly: isSupervisorOrMonitor,
      isSupportStaff,
    }),
    [
      currentUser,
      allStaff,
      loading,
      idleTimedOut,
      switchUser,
      loginWithPin,
      loginWithEmailPassword,
      logout,
      resetIdleTimer,
      idleTimeoutMinutes,
      setIdleTimeoutMinutes,
      remainingIdleSeconds,
      showIdleWarning,
      canScanStudents,
      canScanTeachers,
      canManageStudents,
      canManageStaff,
      canDirectlyEditLogs,
      canApproveEditRequests,
      canSubmitEditRequests,
      canAccessReports,
      canAccessSetup,
      isSuperUser,
      isAdministrative,
      isSupervisorOrMonitor,
      isSupportStaff,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
