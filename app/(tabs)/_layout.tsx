import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#2E8B57' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Browse'   }} />
      <Tabs.Screen name="my-items" options={{ title: 'My Items' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile'  }} />
      <Tabs.Screen name="two"      options={{ href: null        }} />
    </Tabs>
  );
}
