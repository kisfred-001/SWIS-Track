/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { ViewportProvider, useViewport } from './context/ViewportContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AttendanceLogs } from './components/AttendanceLogs';
import { EditRequestsTab } from './components/EditRequestsTab';
import { RosterManagement } from './components/RosterManagement';
import { ReportingView } from './components/ReportingView';
import { CampusesView } from './components/CampusesView';
import { AdminSetupView } from './components/AdminSetupView';
import { StaffManagementView } from './components/StaffManagementView';
import { MobileSignInHub } from './components/MobileSignInHub';
import { ScannerModal } from './components/ScannerModal';
import { UrgentAlertBanner } from './components/UrgentAlertBanner';
import { IdleLockModal } from './components/IdleLockModal';
import { InactivityWarningBanner } from './components/InactivityWarningBanner';
import { LoginScreen } from './components/LoginScreen';
import { MobileDeviceShell } from './components/MobileDeviceShell';
import { ShieldCheck, Scan, School, Loader2 } from 'lucide-react';

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

function AppContent() {
  const { loading: authLoading, currentUser } = useAuth();
  const { loading: attendanceLoading } = useAttendance();
  const { viewportMode } = useViewport();

  // Active navigation tab (persists across sessions and defaults to real-time dashboard)
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('swis_active_tab');
      if (saved) return saved;
    } catch {}
    return 'dashboard';
  });

  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('swis_active_tab', tab);
    } catch {}
  };
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);

  if (authLoading && attendanceLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
          <School className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Synchronizing School Records with Firebase...</span>
        </div>
      </div>
    );
  }

  // Always require sign-in on system launch and whenever unauthenticated
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Core view content
  const renderActiveTabContent = () => (
    <>
      {/* Mobile / Primary Sign In Station for Children and Staff */}
      {activeTab === 'signin' && (
        <MobileSignInHub onNavigateToDashboard={() => handleSetActiveTab('dashboard')} />
      )}

      {activeTab === 'dashboard' && (
        <Dashboard
          onOpenScanner={() => setIsScannerOpen(true)}
          onNavigateToApprovals={() => handleSetActiveTab('approvals')}
        />
      )}

      {/* Staff Management Module */}
      {activeTab === 'staff' && <StaffManagementView />}

      {activeTab === 'campuses' && <CampusesView />}

      {activeTab === 'attendance' && <AttendanceLogs />}

      {activeTab === 'approvals' && <EditRequestsTab />}

      {activeTab === 'roster' && <RosterManagement />}

      {activeTab === 'reports' && <ReportingView />}

      {activeTab === 'setup' && <AdminSetupView />}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Navbar
        onOpenScanner={() => setIsScannerOpen(true)}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
      />

      {/* Real-time Firebase Cloud Messaging Alert Banner for Principals & Directors */}
      <UrgentAlertBanner onNavigateToApprovals={() => handleSetActiveTab('approvals')} />

      {/* Main Content Area: Responsive Fluid vs Mobile Device Shell */}
      {viewportMode === 'mobile' ? (
        <div className="flex-1 w-full flex items-center justify-center py-4 bg-slate-200/70">
          <MobileDeviceShell>
            {renderActiveTabContent()}
          </MobileDeviceShell>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderActiveTabContent()}
        </main>
      )}

      {/* Floating Action Scanner Button (Quick Access) */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-3 rounded-full shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          <Scan className="w-5 h-5 animate-pulse" />
          <span className="text-xs tracking-wide uppercase hidden sm:inline">
            Quick Scan
          </span>
        </button>
      </div>

      {/* Global Attendance Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Security Idle Lock Modal */}
      <IdleLockModal />

      {/* Inactivity Warning Countdown Toast */}
      <InactivityWarningBanner />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SWIS Track School Attendance Management System • Role-Based Access Control Active</span>
          </div>
          <div className="text-slate-400">
            Active Session: <strong className="text-slate-700">{currentUser?.full_name}</strong> ({currentUser?.role})
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <ViewportProvider>
          <AppContent />
        </ViewportProvider>
      </AttendanceProvider>
    </AuthProvider>
  );
}
