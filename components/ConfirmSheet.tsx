import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const translateY    = useRef(new Animated.Value(300)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(300);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY,     { toValue: 300, duration: 250, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={{ flex: 1 }} onPress={onCancel} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <View style={styles.iconRow}>
          <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
            <FontAwesome
              name={destructive ? 'undo' : 'question-circle'}
              size={22}
              color={destructive ? TANG_DEEP : TANGERINE}
            />
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
            onPress={onCancel}
          >
            <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.confirmBtn,
              destructive && styles.confirmBtnDestructive,
              pressed && styles.btnPressed,
            ]}
            onPress={onConfirm}
          >
            <Text style={[styles.confirmBtnText, destructive && styles.confirmBtnTextDestructive]}>
              {confirmLabel}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const TANGERINE = '#F26B3A';
const TANG_DEEP = '#D8531F';
const CREAM     = '#FBF6EE';
const CREAM_2   = '#F4ECDD';
const INK       = '#1F1A17';
const MUTE      = '#847A70';

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 12,
    shadowColor: INK,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: CREAM_2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconRow: { alignItems: 'center', marginBottom: 16 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: { backgroundColor: '#FFF3EC' },
  title: { fontSize: 18, fontWeight: '800', color: INK, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, color: MUTE, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    backgroundColor: CREAM_2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: MUTE },
  confirmBtn: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    backgroundColor: TANGERINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDestructive: { backgroundColor: TANG_DEEP },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: CREAM },
  confirmBtnTextDestructive: { color: CREAM },
  btnPressed: { opacity: 0.75 },
});
