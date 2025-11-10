import { Platform, PermissionsAndroid } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

// Helper: guarantee a string or undefined, required to satisfy ts
function safeString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  // if it's an object/array, stringify it (avoid passing objects directly)
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
} 

// Helper to get image url safely
function safeImageUrl(remoteMessage: FirebaseMessagingTypes.RemoteMessage): string | undefined {
  // prefer data.imageUrl (your server's data payload)
  const dataImage = safeString((remoteMessage as any)?.data?.imageUrl);
  if (dataImage) return dataImage;

  // notification.android.imageUrl (some senders put it here)
  const notifAndroidImage = safeString((remoteMessage as any)?.notification?.android?.imageUrl);
  if (notifAndroidImage) return notifAndroidImage;

  // notification.image or notification['imageUrl'] (other possibilities)
  const notifImage = safeString((remoteMessage as any)?.notification?.image)
                  || safeString((remoteMessage as any)?.notification?.['imageUrl']);
  if (notifImage) return notifImage;

  return undefined;
}

// Creates an android channel for our app
export async function ensureChannel() {
  try {
    await notifee.createChannel({
      id: 'birds',
      name: 'Bird updates',
      importance: AndroidImportance.HIGH,
    });
  } catch (e) {
    console.warn('ensureChannel error', e);
  }
}

// Top-level background handler (must be top-level) 
export const backgroundMessageHandler = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) => {
  try {
    //  if server sends notification, then android OS handles this, skip creating one manually
    if (remoteMessage?.notification) {
      console.log('Server sent notification block — skipping local display (bg).');
      return Promise.resolve();
    }

    console.log('BG message:', remoteMessage);
    await ensureChannel();

    const title =
      safeString(remoteMessage?.data?.title) ??
      safeString(remoteMessage?.notification?.title) ??
      'Bird update';
    const body =
      safeString(remoteMessage?.data?.body) ??
      safeString(remoteMessage?.notification?.body) ??
      safeString(remoteMessage?.data) ??
      'New bird event';

    const imageUrl = safeImageUrl(remoteMessage); // may be undefined

    // build android options conditionally
    const androidOptions: any = {
      channelId: 'birds',
      smallIcon: 'ic_stat_bird',
      pressAction: { id: 'default' },
    };

    if (imageUrl) {
      androidOptions.largeIcon = imageUrl;
      androidOptions.style = {
        type: ((notifee as any).AndroidStyle?.BIGPICTURE ?? 0),
        picture: imageUrl as string,
      };
    }

    await notifee.displayNotification({
      title,
      body,
      android: androidOptions,
      data: { payload: safeString(remoteMessage?.data) ?? '' },
    });

  } catch (err) {
    console.warn('BG handler error', err);
  }

  return Promise.resolve();
};
// Background handler at top-level so native can call it
messaging().setBackgroundMessageHandler(backgroundMessageHandler);

// Background event handler for Notifee (top-level so headless JS can call it)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  try {
    if (type === EventType.PRESS) {
      console.log('Notification pressed (bg):', detail.notification, detail.pressAction);
      // e.g., navigate / mark read / open specific screen via deep link (store in AsyncStorage)
    } else if (type === EventType.DISMISSED) {
      console.log('Notification dismissed (bg):', detail.notification);
      // optional: analytics, cleanup, etc.
    }
  } catch (err) {
    console.warn('notifee bg handler err', err);
  }
});

// Foreground handler (runs while app is active)
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('Notification pressed (fg):', detail.notification, detail.pressAction);
  } else if (type === EventType.DISMISSED) {
    console.log('Notification dismissed (fg):', detail.notification);
  }
});


// initFCM: runs only when the app is opened, call from your App root (e.g., App.tsx useEffect),
export async function initFCM() {
  try {
    // Android 13+ needs POST_NOTIFICATIONS runtime permission
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        console.log('POST_NOTIFICATIONS permission:', granted);
      } catch (permErr) {
        console.warn('POST_NOTIFICATIONS request failed', permErr);
      }
    }

    await ensureChannel();

    // Request FCM permission (iOS / general)
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('FCM permission not granted');
      }
    } catch (permE) {
      console.warn('FCM requestPermission error', permE);
    }

    // Get token
    const token = await messaging().getToken();
    console.log('FCM token:', token);

    // Subscribe to 'bird_updates' topic
    try {
      await messaging().subscribeToTopic('birds_updates');
      console.log('Subscribed to topic: birds_updates');
    } catch (e) {
      console.warn('Topic subscribe failed', e);
    }
    // Optionally save token to Firestore for testing / server usage
    try {
      await firestore().collection('device_tokens').doc(token).set({
        token,
        platform: Platform.OS,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('Saved token to Firestore');
    } catch (dbErr) {
      console.warn('Could not save token to Firestore (ok if firestore not installed):', dbErr);
    }

    // Handle token refresh
    messaging().onTokenRefresh(async newToken => {
      console.log('Token refreshed:', newToken);
      try {
        await firestore().collection('device_tokens').doc(newToken).set({
          token: newToken,
          platform: Platform.OS,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        // ignore
      }
    });

    // Foreground messages: show local notification
    messaging().onMessage(async remoteMessage => {
      try {
        console.log('Foreground message:', remoteMessage);

        const title =
          safeString(remoteMessage?.data?.title) ??
          safeString(remoteMessage?.notification?.title) ??
          'Bird update';
        const body =
          safeString(remoteMessage?.data?.body) ??
          safeString(remoteMessage?.notification?.body) ??
          safeString(remoteMessage?.data) ??
          'New bird event';
        
        const imageUrl = safeImageUrl(remoteMessage);

        const androidOptionsFg: any = {
          channelId: 'birds',
          smallIcon: 'ic_stat_bird',
        };

        if (imageUrl) {
          androidOptionsFg.largeIcon = imageUrl;
          androidOptionsFg.style = {
            type: ((notifee as any).AndroidStyle?.BIGPICTURE ?? 0),
            picture: imageUrl as string,
          };
        }

        await notifee.displayNotification({
          title,
          body,
          android: androidOptionsFg,
          data: { payload: safeString(remoteMessage?.data) ?? '' },
        });

      } catch (e) {
        console.warn('onMessage display error', e);
      }
    });
  } catch (e) {
    console.error('initFCM error', e);
  }
}