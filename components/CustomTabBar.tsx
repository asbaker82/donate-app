import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useApp } from '@/store/AppContext';
import { Item } from '@/store/types';

const TABS: { name: string; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { name: 'index',    label: 'Browse',   icon: 'search' },
  { name: 'my-items', label: 'My Items', icon: 'gift'   },
];

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { dismissed, restoreItem, restoreAll, getFriendItems } = useApp();
  const hiddenItems = getFriendItems().filter(item => dismissed.has(item.id));
  const hiddenCount = hiddenItems.length;

  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <View style={styles.bar}>
      {TABS.map(tab => {
        const route = state.routes.find(r => r.name === tab.name);
        if (!route) return null;
        const focused = state.index === state.routes.indexOf(route);
        const color = focused ? '#F26B3A' : '#B0A89E';

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

      {/* Trash icon — bottom-right of My Items tab, always rendered but faint */}
      <Pressable
        style={[styles.trashBtn, hiddenCount === 0 && styles.trashBtnEmpty]}
        onPress={() => hiddenCount > 0 && setSheetOpen(true)}
        accessibilityLabel="Hidden items"
      >
        <FontAwesome name="trash-o" size={13} color="#B0A89E" />
        {hiddenCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{hiddenCount}</Text>
          </View>
        )}
      </Pressable>

      {/* Hidden items sheet */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setSheetOpen(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Hidden Items ({hiddenCount})</Text>
                <Pressable onPress={() => { restoreAll(); setSheetOpen(false); }}>
                  <Text style={styles.restoreAllText}>Restore all</Text>
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {hiddenItems.map((item: Item) => (
                  <View key={item.id} style={styles.row}>
                    {item.photos.length > 0 ? (
                      <Image source={{ uri: item.photos[0] }} style={styles.thumb} />
                    ) : (
                      <View style={[styles.thumb, styles.thumbEmpty]}>
                        <FontAwesome name="image" size={16} color="#C9BCA8" />
                      </View>
                    )}
                    <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
                    <Pressable style={styles.restoreBtn} onPress={() => restoreItem(item.id)}>
                      <Text style={styles.restoreBtnText}>Restore</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FBF6EE',
    borderTopWidth: 1,
    borderTopColor: 'rgba(31,26,23,0.08)',
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

  trashBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 8 : 14,
    right: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashBtnEmpty: { opacity: 0.35 },
  badge: {
    position: 'absolute',
    top: -3,
    right: -4,
    backgroundColor: '#847A70',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: { fontSize: 8, color: '#FBF6EE', fontWeight: '700' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FBF6EE',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C9BCA8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#1F1A17' },
  restoreAllText: { fontSize: 13, fontWeight: '700', color: '#F26B3A' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE6D8',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F4ECDD',
  },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F1A17' },
  restoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFF3EC',
    borderWidth: 1,
    borderColor: '#F26B3A',
  },
  restoreBtnText: { fontSize: 12, fontWeight: '700', color: '#F26B3A' },
});
