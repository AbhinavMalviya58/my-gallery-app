import { useSSO } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect } from 'react';
import { Button, Platform, View } from 'react-native';
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const navigation = useNavigation();
  const { startSSOFlow } = useSSO();

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync?.();
    return () => void WebBrowser.coolDownAsync?.();
  }, []);

  const onGooglePress = useCallback(async () => {
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'mygalleryapp',
        path: 'sso-callback', // optional
        // for quick dev testing you could set useProxy: true, but prefer dev client
      });

      const res = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl,
      });

      const { createdSessionId, setActive, signIn, signUp } = res;

      if (createdSessionId && setActive) {
        await setActive({
          session: createdSessionId,
          navigate: async () => {
            // Switch to the authenticated tabs in React Navigation stack
            // Use replace to avoid going back to Login
            // @ts-ignore - name exists in our stack
            navigation.replace?.('MainTabs');
          },
        });
        return;
      }

      // If no createdSessionId then check signIn / signUp flow objects for extra steps.
      console.log('SSO result (no session):', { signIn, signUp });
    } catch (err) {
      console.error('Google SSO error:', err);
    }
  }, [startSSOFlow, navigation]);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Button title='Sign in with Google' onPress={onGooglePress} />
    </View>
  );
};

export default LoginScreen;
