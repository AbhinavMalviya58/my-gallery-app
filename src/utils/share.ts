import * as Sharing from 'expo-sharing';

export const shareImage = async (uri: string, text?: string) => {
  try {
    const canNativeShare = await Sharing.isAvailableAsync();
    if (canNativeShare) {
      await Sharing.shareAsync(uri, { dialogTitle: text || 'Share image' });
      return true;
    }
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: 'Image', text, url: uri });
        return true;
      } catch {}
    }
    // Fallback: open in new tab
    if (typeof window !== 'undefined') {
      window.open(uri, '_blank');
      return true;
    }
  } catch (e) {
    console.warn('shareImage error', e);
  }
  return false;
};
