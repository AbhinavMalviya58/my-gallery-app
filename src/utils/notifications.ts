import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissionsIfNeeded = async () => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    return res.status === 'granted';
  }
  return true;
};

export const notifyImageAdded = async (caption: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Image added',
      body: caption ? `“${caption}”` : 'New image saved to your gallery',
    },
    trigger: null,
  });
};
