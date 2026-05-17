import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Props {
  visible: boolean;
  onComplete: () => void;
}

export default function WaitlistToast({ visible, onComplete }: Props) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const iconScale  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(80);
    opacity.setValue(0);
    iconScale.setValue(0);

    Animated.sequence([
      // Slide up + fade in + icon pop
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity,    { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(150),
          Animated.spring(iconScale, { toValue: 1, tension: 120, friction: 5, useNativeDriver: true }),
        ]),
      ]),
      Animated.delay(1400),
      // Slide down + fade out
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
        <FontAwesome name="list-ol" size={18} color="#fff" />
      </Animated.View>
      <View>
        <Text style={styles.title}>Added to Waitlist</Text>
        <Text style={styles.sub}>We'll let you know if it becomes available.</Text>
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
    backgroundColor: '#1F1A17',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    shadowColor: '#1F1A17',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 100,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E89A8D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#FBF6EE' },
  sub:   { fontSize: 12, color: '#847A70', marginTop: 2 },
});
