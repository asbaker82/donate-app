import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Props {
  visible: boolean;
  deadlineDate: Date | null;
  onComplete: () => void;
}

function formatDeadline(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffH  = Math.ceil(diffMs / 3600000);
  const time   = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day    = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  if (diffH <= 24) return `by ${time} today (${diffH}h)`;
  return `by ${time} on ${day}`;
}

export default function ClaimToast({ visible, deadlineDate, onComplete }: Props) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(80);
    opacity.setValue(0);
    iconScale.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(150),
          Animated.spring(iconScale, { toValue: 1, tension: 120, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      Animated.delay(2600),
      Animated.parallel([
        Animated.timing(translateY, { toValue: 80, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 0,  duration: 300, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => { if (finished) onComplete(); });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }] }]}>
        <FontAwesome name="check" size={18} color="#fff" />
      </Animated.View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Item Claimed!</Text>
        <Text style={styles.sub}>
          {deadlineDate ? `Pick up ${formatDeadline(deadlineDate)}` : 'Arrange pickup with the donor.'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#2d3748',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sub:   { fontSize: 12, color: '#a0aec0', marginTop: 2 },
});
