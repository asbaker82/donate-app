import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { AppProvider } from '@/store/AppContext';
import { queryClient, asyncStoragePersister } from '@/lib/queryClient';
import HeaderLogo from '@/components/HeaderLogo';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    BricolageGrotesque_800ExtraBold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <AuthProvider>
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { authUser, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!authUser && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (authUser && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [authUser, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#F26B3A" />
      </View>
    );
  }

  const headerLogo = () => <HeaderLogo size={20} />;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#111827',
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
          headerShadowVisible: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="item/[id]"
          options={{ headerTitle: headerLogo, headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="item/new"
          options={{ headerTitle: headerLogo, presentation: 'modal' }}
        />
        <Stack.Screen
          name="item/edit/[id]"
          options={{ headerTitle: headerLogo, presentation: 'modal' }}
        />
        <Stack.Screen
          name="items-list"
          options={{ headerTitle: headerLogo, headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="add-friends"
          options={{ headerTitle: headerLogo, headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ headerTitle: headerLogo, headerBackTitle: 'Back' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
