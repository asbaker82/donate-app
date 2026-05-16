import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const COLORS = ['#2E8B57', '#48BB78', '#F6E05E', '#FC8181', '#63B3ED', '#B794F4', '#F6AD55', '#FBD38D'];
const PARTICLE_COUNT = 20;

// Pre-compute static particle properties so interpolations are stable across renders
const PARTICLE_DEFS = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
  distance: 90 + (i % 4) * 35,
  color: COLORS[i % COLORS.length],
  size: 7 + (i % 3) * 4,
}));

interface Props {
  visible: boolean;
  onComplete: () => void;
}

export default function ClaimCelebration({ visible, onComplete }: Props) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const checkScale    = useRef(new Animated.Value(0)).current;
  const checkOpacity  = useRef(new Animated.Value(0)).current;
  const labelOpacity  = useRef(new Animated.Value(0)).current;
  const particleProgress = useRef(
    PARTICLE_DEFS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!visible) return;

    overlayOpacity.setValue(0);
    checkScale.setValue(0);
    checkOpacity.setValue(0);
    labelOpacity.setValue(0);
    particleProgress.forEach(p => p.setValue(0));

    Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(checkScale,   { toValue: 1, tension: 70, friction: 5, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(labelOpacity, { toValue: 1, duration: 300, delay: 150, useNativeDriver: true }),
        ...particleProgress.map(p =>
          Animated.timing(p, { toValue: 1, duration: 800, useNativeDriver: true })
        ),
      ]),
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(checkOpacity,   { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(labelOpacity,   { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => { if (finished) onComplete(); });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Confetti burst from centre */}
      <View style={styles.particleOrigin} pointerEvents="none">
        {PARTICLE_DEFS.map((def, i) => {
          const tx = particleProgress[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(def.angle) * def.distance],
          });
          const ty = particleProgress[i].interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(def.angle) * def.distance],
          });
          const opacity = particleProgress[i].interpolate({
            inputRange: [0, 0.6, 1],
            outputRange: [1, 1, 0],
          });
          const scale = particleProgress[i].interpolate({
            inputRange: [0, 0.15, 1],
            outputRange: [0, 1, 0.5],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: def.size,
                height: def.size,
                borderRadius: def.size / 2,
                backgroundColor: def.color,
                transform: [{ translateX: tx }, { translateY: ty }, { scale }],
                opacity,
              }}
            />
          );
        })}
      </View>

      {/* Checkmark circle */}
      <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }], opacity: checkOpacity }]}>
        <FontAwesome name="check" size={52} color="#fff" />
      </Animated.View>

      <Animated.Text style={[styles.claimedLabel, { opacity: labelOpacity }]}>
        Item Claimed! 🎉
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  particleOrigin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: '50%',
    left: '50%',
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2E8B57',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  },
  claimedLabel: {
    marginTop: 24,
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
