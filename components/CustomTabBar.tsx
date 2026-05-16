import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const TABS: { name: string; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { name: 'index',    label: 'Browse',   icon: 'search' },
  { name: 'my-items', label: 'My Items', icon: 'gift'   },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
      {TABS.map(tab => {
        const route = state.routes.find(r => r.name === tab.name);
        if (!route) return null;
        const focused = state.index === state.routes.indexOf(route);
        const color = focused ? '#10B981' : '#a0aec0';

        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.name)}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <FontAwesome name={tab.icon} size={22} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 12 : 20,
    minHeight: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
