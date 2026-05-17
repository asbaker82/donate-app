import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';
import ProfileHeaderButton from '@/components/ProfileHeaderButton';
import HeaderLogo from '@/components/HeaderLogo';

const profileBtn = () => <ProfileHeaderButton />;
const headerLogo = () => <HeaderLogo size={20} />;

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FBF6EE' },
        headerTintColor: '#1F1A17',
        headerTitleStyle: { fontWeight: '700', color: '#1F1A17' },
        headerTitleAlign: 'left',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index"    options={{ headerTitle: headerLogo, headerRight: profileBtn }} />
      <Tabs.Screen name="my-items" options={{ headerTitle: headerLogo, headerRight: profileBtn }} />
      <Tabs.Screen name="profile"  options={{ headerTitle: headerLogo, href: null }} />
      <Tabs.Screen name="two"      options={{ href: null }} />
    </Tabs>
  );
}
