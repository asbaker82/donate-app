import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';
import ProfileHeaderButton from '@/components/ProfileHeaderButton';

const profileBtn = () => <ProfileHeaderButton />;

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#111827',
        headerTitleStyle: { fontWeight: '700', color: '#111827' },
        headerShadowVisible: true,
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Browse',   headerRight: profileBtn }} />
      <Tabs.Screen name="my-items" options={{ title: 'My Items', headerRight: profileBtn }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile',  href: null }} />
      <Tabs.Screen name="two"      options={{ href: null }} />
    </Tabs>
  );
}
