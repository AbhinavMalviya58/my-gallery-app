import { useSSO } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

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
        path: 'sso-callback',
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
            // Switch to authenticated tabs
            // @ts-ignore
            navigation.replace?.('MainTabs');
          },
        });
        return;
      }

      console.log('SSO result (no session):', { signIn, signUp });
    } catch (err) {
      console.error('Google SSO error:', err);
    }
  }, [startSSOFlow, navigation]);

  return (
    <LinearGradient
      colors={['#ff3c00ff', '#00f2fe']}
      style={styles.container}
    >
      <View style={styles.card}>
        <Image
  source={require('../../../assets/app_logo.png')}
  style={styles.logo}
  resizeMode="contain"
/>
        <Text style={styles.title}>Welcome to MyGalleryApp</Text>
        <Text style={styles.subtitle}>
          Sign in to continue
        </Text>

        <TouchableOpacity style={styles.googleBtn} onPress={onGooglePress}>
          <AntDesign name="google" size={22} color="#EA4335" style={{ marginRight: 8 }} />
          <Text style={styles.googleBtnText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    width: '85%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default LoginScreen;
