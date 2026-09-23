import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Staff, UserRole } from '../types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { INITIAL_STAFF, SUPER_USER_ACCOUNT, ensureSuperUserAccount } from '../firebase/seed';
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
  isSuperUser: boolean;
  isTeacherOnly: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allStaff, setAllStaff] = useState<Staff[]>(INITIAL_STAFF);
  // Default to Super User (Fredrick Kariuki - kisfred@gmail.com)
  const [currentUser, setCurrentUser] = useState<Staff | null>(INITIAL_STAFF[0]);
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
    ensureSuperUserAccount().catch((e) => console.warn('Super user init:', e));
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
        cleanEmail === SUPER_USER_ACCOUNT.email.toLowerCase() &&
        cleanPass === SUPER_USER_ACCOUNT.password
      ) {
        try {
          await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        } catch {
          try {
            await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
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

      // Check other staff accounts by email and password/PIN
      const foundStaff = allStaff.find(
        (s) =>
          s.email.toLowerCase() === cleanEmail &&
          (s.password === cleanPass || s.pin_code === cleanPass)
      );

      if (foundStaff) {
        switchUser(foundStaff);
        return { success: true };
      }

      // Try Firebase Auth
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
        const match = allStaff.find((s) => s.email.toLowerCase() === cleanEmail);
        if (match) {
          switchUser(match);
          return { success: true };
        }
      } catch (err: any) {
        // Continue to error return
      }

      return {
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
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
          const staffList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Staff[];
          setAllStaff(staffList);
          // If current user is present in the updated list, refresh current user object
          if (currentUser) {
            const found = staffList.find((s) => s.staff_id === currentUser.staff_id);
            if (found) {
              setCurrentUser(found);
            }
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Staff listener fallback:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Check stored active staff on mount
  useEffect(() => {
    const savedId = localStorage.getItem('edutrack_active_staff_id');
    const savedActivity = localStorage.getItem('swis_last_activity');
    const now = Date.now();

    // Check if previously stored session has already exceeded inactivity timeout
    const timeoutMs = idleTimeoutMinutes * 60 * 1000;
    if (savedActivity && now - Number(savedActivity) > timeoutMs) {
      logout(true);
      return;
    }

    if (savedId) {
      const found = allStaff.find((s) => s.staff_id === savedId);
      if (found) {
        setCurrentUser(found);
        resetIdleTimer();
      }
    }
  }, [allStaff, idleTimeoutMinutes, logout, resetIdleTimer]);

  // Activity event listener to reset idle timer
  useEffect(() => {
    if (!currentUser) return;

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle event handling to once every 1 second
      if (now - lastThrottleRef.current > 1000) {
        lastThrottleRef.current = now;
        resetIdleTimer();
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click', 'wheel', 'pointerdown'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, [currentUser, resetIdleTimer]);

  // Inactivity timeout checker interval (checks every second)
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
      setRemainingIdleSeconds(remainingSecs);

      // Show countdown warning toast when 60 seconds or less remain
      if (remainingSecs <= 60 && remainingSecs > 0) {
        setShowIdleWarning(true);
      } else {
        setShowIdleWarning(false);
      }

      // Inactivity timeout expired -> Auto sign-out and lock terminal
      if (elapsed >= timeoutMs) {
        console.log(`[Security] ${idleTimeoutMinutes} minutes of inactivity reached. Auto-signing out for school safety.`);
        setShowIdleWarning(false);
        logout(true);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [currentUser, idleTimeoutMinutes, logout]);

  const role: UserRole | undefined = currentUser?.role;

  // Strict RBAC definitions:
  // 1. Teachers: Can scan students in/out. Cannot scan teachers. Cannot directly edit logs.
  // 2. Admin Assistants: All student scanning + can scan teachers in/out + manage class rosters. Cannot directly edit logs.
  // 3. Principals & Directors: Full student & teacher scanning + directly edit/delete logs + approve/reject edit requests.
  // 4. ICCE Coordinators: All admin privileges + Super Users (create accounts for anyone, assign roles, generate codes).
  const canScanStudents = true; // All authenticated staff can scan students
  const canScanTeachers = role === 'Admin Assistant' || role === 'Principal' || role === 'Director' || role === 'ICCE Coordinator';
  const canManageStudents = role === 'Admin Assistant' || role === 'Principal' || role === 'Director' || role === 'ICCE Coordinator' || role === 'Teacher';
  const canManageStaff = role === 'ICCE Coordinator';
  const canDirectlyEditLogs = role === 'Principal' || role === 'Director' || role === 'ICCE Coordinator';
  const canApproveEditRequests = role === 'Principal' || role === 'Director' || role === 'ICCE Coordinator';
  const isSuperUser = role === 'ICCE Coordinator';
  const isTeacherOnly = role === 'Teacher';

  return (
    <AuthContext.Provider
      value={{
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
        isSuperUser,
        isTeacherOnly,
      }}
    >
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
