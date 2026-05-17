import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

const TANGERINE = '#F26B3A';
const TANG_DEEP = '#D8531F';
const CREAM     = '#FBF6EE';
const INK       = '#1F1A17';
const MUTE      = '#847A70';

const STICKER_W = 252;
const STICKER_H = 196;
const STICKER_R = 18;

export default function WelcomeScreen() {
  const router = useRouter();

  // Sticker entry animation
  const stickerRotate    = useRef(new Animated.Value(-26)).current;
  const stickerScale     = useRef(new Animated.Value(0.78)).current;
  const stickerTranslateY = useRef(new Animated.Value(-60)).current;

  // Idle wobble
  const wobble = useRef(new Animated.Value(0)).current;

  // Content fade-ins
  const kickerOpacity   = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity      = useRef(new Animated.Value(0)).current;
  const ghostOpacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(stickerRotate,     { toValue: 0, tension: 160, friction: 10, useNativeDriver: true }),
      Animated.spring(stickerScale,      { toValue: 1, tension: 160, friction: 10, useNativeDriver: true }),
      Animated.spring(stickerTranslateY, { toValue: 0, tension: 160, friction: 10, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1, duration: 2200, useNativeDriver: true }),
          Animated.timing(wobble, { toValue: 0, duration: 2200, useNativeDriver: true }),
        ]),
      ).start();
    });

    const fade = (anim: Animated.Value, delay: number) =>
      Animated.timing(anim, { toValue: 1, duration: 500, delay, useNativeDriver: true });

    Animated.parallel([
      fade(kickerOpacity,   150),
      fade(headlineOpacity, 950),
      fade(subtitleOpacity, 1150),
      fade(ctaOpacity,      1350),
      fade(ghostOpacity,    1500),
    ]).start();
  }, []);

  const stickerRotateDeg = stickerRotate.interpolate({
    inputRange: [-26, 0],
    outputRange: ['-26deg', '0deg'],
  });

  const wobbleDeg = wobble.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-4deg', '-2deg', '-4deg'],
  });

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* Kicker */}
      <Animated.Text style={[styles.kicker, { opacity: kickerOpacity }]}>
        yoink-it · welcome
      </Animated.Text>

      {/* Sticker hero */}
      <Animated.View
        style={[
          styles.stickerWrap,
          {
            transform: [
              { translateY: stickerTranslateY },
              { rotate: stickerRotateDeg },
              { scale: stickerScale },
            ],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: wobbleDeg }] }}>
          {/* Shadow wrapper (overflow visible so shadow shows through rounded clip) */}
          <View style={styles.stickerShadow}>
            {/* Inner clip — rounds all four corners */}
            <View style={styles.sticker}>
              <Text style={styles.stickerYoink}>Yoink</Text>
              <Text style={styles.stickerIt}>It.</Text>

              {/* Peel corner: a white rounded rect anchored to the bottom-right corner.
                  borderTopLeftRadius gives it a smooth curved fold edge. */}
              <View style={styles.peelCorner} />
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Headline */}
      <Animated.Text style={[styles.headline, { opacity: headlineOpacity }]}>
        Free stuff from{'\n'}your block.
      </Animated.Text>

      {/* Subtitle */}
      <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
        Give away things you no longer need.{'\n'}Grab things your neighbors are letting go.
      </Animated.Text>

      {/* CTAs */}
      <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity }]}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.replace('/(auth)/phone')}
        >
          <Text style={styles.primaryBtnText}>Get started →</Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={{ opacity: ghostOpacity }}>
        <Pressable
          style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.replace('/(auth)/phone')}
        >
          <Text style={styles.ghostBtnText}>I already have an account</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 48,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    color: MUTE,
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  stickerWrap: {
    marginBottom: 40,
  },
  // Outer shell carries the shadow; overflow must be visible for shadow to show
  stickerShadow: {
    width: STICKER_W,
    height: STICKER_H,
    borderRadius: STICKER_R,
    shadowColor: TANG_DEEP,
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  // Inner shell clips children to the sticker's rounded rect
  sticker: {
    width: STICKER_W,
    height: STICKER_H,
    backgroundColor: TANGERINE,
    borderRadius: STICKER_R,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // White rounded rect anchored to the bottom-right corner.
  // borderTopLeftRadius gives the fold edge its curve; the other radii
  // match the sticker's own corner so it looks like the corner is lifting.
  peelCorner: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 56,
    height: 40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderBottomRightRadius: STICKER_R,
  },
  stickerYoink: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 84,
    fontStyle: 'italic',
    color: CREAM,
    lineHeight: 80,
    includeFontPadding: false,
  },
  stickerIt: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 84,
    fontStyle: 'italic',
    color: CREAM,
    lineHeight: 80,
    includeFontPadding: false,
    alignSelf: 'flex-end',
    marginRight: 24,
    marginTop: -16,
  },
  headline: {
    fontFamily: 'BricolageGrotesque_800ExtraBold',
    fontSize: 36,
    fontStyle: 'italic',
    color: INK,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 15,
    color: MUTE,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  ctaWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: TANGERINE,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 40,
    shadowColor: TANG_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: CREAM,
    letterSpacing: 0.3,
  },
  ghostBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  ghostBtnText: {
    fontSize: 14,
    color: MUTE,
    fontWeight: '500',
  },
});
