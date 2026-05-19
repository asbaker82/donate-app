import React, { useRef } from 'react';
import { Animated, PanResponder, View, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const THRESHOLD = 100; // px left to trigger dismiss
const OUT_DURATION = 220;

interface Props {
  onDismiss: () => void;
  children: React.ReactNode;
}

export default function SwipeableCard({ onDismiss, children }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -THRESHOLD || g.vx < -0.6) {
          Animated.timing(translateX, {
            toValue: -600,
            duration: OUT_DURATION,
            useNativeDriver: true,
          }).start(() => onDismiss());
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const opacity = translateX.interpolate({
    inputRange: [-200, -60, 0],
    outputRange: [0, 0.85, 1],
    extrapolate: 'clamp',
  });

  const hintOpacity = translateX.interpolate({
    inputRange: [-THRESHOLD, -30, 0],
    outputRange: [1, 0.4, 0],
    extrapolate: 'clamp',
  });
  const hintScale = translateX.interpolate({
    inputRange: [-THRESHOLD, -30, 0],
    outputRange: [1, 0.7, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Hint revealed as card slides left */}
      <Animated.View style={[styles.hint, { opacity: hintOpacity }]}>
        <Animated.View style={{ transform: [{ scale: hintScale }] }}>
          <FontAwesome name="eye-slash" size={22} color="#847A70" />
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={{ transform: [{ translateX }], opacity }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  hint: {
    position: 'absolute',
    right: 28,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
