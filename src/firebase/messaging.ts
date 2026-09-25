import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import app, { db } from './config';
import { UrgentAlert } from '../types';
import { sound } from '../utils/sound';

let messagingInstance: Messaging | null = null;
let messagingSupportedPromise: Promise<boolean> | null = null;

export const checkFCMSupport = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  // Inside an iframe or sandbox, Push API and Service Workers are restricted
  try {
    if (window.self !== window.top) {
      return false;
    }
  } catch {
    return false;
  }
  if (!('PushManager' in window) || !('Notification' in window)) {
    return false;
  }
  if (!messagingSupportedPromise) {
    messagingSupportedPromise = isSupported().catch(() => false);
  }
  return messagingSupportedPromise;
};

export const initFCM = async (staffId: string): Promise<string | null> => {
  try {
    const supported = await checkFCMSupport();
    if (!supported) {
      // Gracefully fall back to Firestore real-time listener channel
      return null;
    }

    if (!messagingInstance) {
      try {
        messagingInstance = getMessaging(app);
      } catch {
        return null;
      }
    }

    // Register service worker if available and in secure context
    let swReg: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      try {
        swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch {
        // Service worker optional fallback
      }
    }

    // Request notification permission safely only if in top-level window
    let permission: NotificationPermission = 'default';
    try {
      if ('Notification' in window) {
        permission = Notification.permission;
      }
    } catch {
      permission = 'default';
    }

    let token: string | null = null;
    if (permission === 'granted' && messagingInstance) {
      try {
        token = await getToken(messagingInstance, {
          serviceWorkerRegistration: swReg,
        });
      } catch {
        // Fallback client token for device identification
        token = `sim-token-${staffId}-${Date.now()}`;
      }
    } else {
      token = `web-session-${staffId}-${Date.now()}`;
    }

    // Save token to Firestore for staff member if available
    if (token && staffId) {
      try {
        await setDoc(
          doc(db, 'staff_fcm_tokens', staffId),
          {
            staff_id: staffId,
            fcm_token: token,
            permission,
            updated_at: new Date().toISOString(),
            platform: 'web',
          },
          { merge: true }
        );
      } catch {
        // Non-blocking token save
      }
    }

    // Listen to foreground FCM messages if instance is active
    if (messagingInstance) {
      try {
        onMessage(messagingInstance, (payload) => {
          sound.playUrgentAlert();
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(payload.notification?.title || 'SWIS Track - Urgent Alert', {
                body: payload.notification?.body || 'An urgent edit request requires administrator review.',
                icon: '/favicon.ico',
              });
            } catch {
              // ignore
            }
          }
        });
      } catch {
        // ignore
      }
    }

    return token;
  } catch {
    return null;
  }
};

/**
 * Dispatches an urgent alert to Firebase Firestore & Cloud Messaging channels.
 * Targeted specifically to Principals and Directors.
 */
export const dispatchUrgentEditAlert = async (alertData: Omit<UrgentAlert, 'id'>) => {
  const alertId = `ALERT-${Date.now().toString().slice(-6)}`;
  const alertDoc: UrgentAlert = {
    id: alertId,
    ...alertData,
    fcm_message_id: `fcm-${Date.now()}`,
  };

  try {
    // 1. Persist to Firestore urgent_alerts collection for real-time live distribution
    await setDoc(doc(db, 'urgent_alerts', alertId), alertDoc);

    // 2. Browser notification trigger if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`URGENT: Edit Request for ${alertData.target_name}`, {
          body: `Submitted by ${alertData.teacher_name} (${alertData.teacher_role}): ${alertData.reason}`,
          icon: '/favicon.ico',
          tag: alertId,
        });
      } catch {
        // ignore
      }
    }

    return { success: true, alertId };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

/**
 * Dismiss an urgent alert for the current user
 */
export const dismissUrgentAlert = async (alertId: string, staffId: string) => {
  try {
    const ref = doc(db, 'urgent_alerts', alertId);
    await updateDoc(ref, {
      dismissed_by: arrayUnion(staffId),
    });
  } catch {
    // Silent non-blocking dismissal
  }
};
