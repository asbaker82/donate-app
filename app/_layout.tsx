import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/store/AuthContext';
import { AppProvider } from '@/store/AppContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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
    <AuthProvider>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </AuthProvider>
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
      router.replace('/(auth)/phone');
    } else if (authUser && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [authUser, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

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
          options={{ title: 'Item Details', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="item/new"
          options={{ title: 'New Listing', presentation: 'modal' }}
        />
        <Stack.Screen
          name="item/edit/[id]"
          options={{ title: 'Edit Listing', presentation: 'modal' }}
        />
        <Stack.Screen
          name="items-list"
          options={({ route }) => {
            const filter = (route.params as any)?.filter;
            const titles: Record<string, string> = {
              listed: 'My Listings',
              active: 'Active Listings',
              claimed: 'Claimed by You',
            };
            return { title: titles[filter] ?? 'Items', headerBackTitle: 'Back' };
          }}
        />
        <Stack.Screen
          name="add-friends"
          options={{ title: 'Add Friends', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ title: 'Edit Profile', headerBackTitle: 'Back' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
