import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

// Background handler (top-level — keep this here)
export const backgroundMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  console.log('BG message:', remoteMessage);
  // light processing: update DB, show local notif (not done here)
  return Promise.resolve();
};
messaging().setBackgroundMessageHandler(backgroundMessageHandler);

// initFCM: call this from App root
export async function initFCM() {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('FCM permission not granted');
      return;
    }

    // get token
    const token = await messaging().getToken();
    console.log('FCM token:', token);

    // optional: save token to Firestore for testing / later pushes
    try {
      await firestore().collection('device_tokens').doc(token).set({
        token,
        platform: 'android',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      console.log('Saved token to Firestore');
    } catch (err) {
      console.log('Could not save token to Firestore (ok if firestore not installed):', err);
    }

    // handle token refresh
    messaging().onTokenRefresh(newToken => {
      console.log('Token refreshed:', newToken);
      // update backend / Firestore similarly
      firestore().collection('device_tokens').doc(newToken).set({
        token: newToken,
        platform: 'android',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      }).catch(()=>{});
    });

    // foreground messages
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      // show local notification here (use Notifee or similar)
    });
  } catch (e) {
    console.error('initFCM error', e);
  }
}