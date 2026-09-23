import React, { createContext, useContext, useState, useEffect } from 'react';
import { Staff, UserRole } from '../types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { INITIAL_STAFF } from '../firebase/seed';

interface AuthContextType {
  currentUser: Staff | null;
  allStaff: Staff[];
  loading: boolean;
  switchUser: (staff: Staff) => void;
  loginWithPin: (pin: string) => boolean;
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
  // Default to Eleanor Vance (ICCE Coordinator) or Amanda Cruz or David Miller
  const [currentUser, setCurrentUser] = useState<Staff | null>(INITIAL_STAFF[0]);
  const [loading, setLoading] = useState<boolean>(true);

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
  }, []);

  const switchUser = (staff: Staff) => {
    setCurrentUser(staff);
    localStorage.setItem('edutrack_active_staff_id', staff.staff_id);
  };

  const loginWithPin = (pin: string): boolean => {
    const found = allStaff.find((s) => s.pin_code.trim() === pin.trim());
    if (found) {
      switchUser(found);
      return true;
    }
    return false;
  };

  // Check stored active staff on mount
  useEffect(() => {
    const savedId = localStorage.getItem('edutrack_active_staff_id');
    if (savedId) {
      const found = allStaff.find((s) => s.staff_id === savedId);
      if (found) {
        setCurrentUser(found);
      }
    }
  }, [allStaff]);

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
        switchUser,
        loginWithPin,
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
