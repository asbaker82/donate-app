import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Props {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex = 0, visible, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(images.length - 1, i + 1));

  // Keyboard navigation on web
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!images.length) return null;

  const hasPrev = index > 0;
  const hasNext = index < images.length - 1;
  const multi = images.length > 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>

        {/* Header bar */}
        <View style={styles.header}>
          <Text style={styles.counter}>{index + 1} / {images.length}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <FontAwesome name="times" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Main image — tap backdrop to close */}
        <Pressable style={styles.imageArea} onPress={onClose}>
          <Pressable onPress={e => e.stopPropagation()}>
            <Image
              source={{ uri: images[index] }}
              style={styles.mainImage}
              resizeMode="contain"
            />
          </Pressable>
        </Pressable>

        {/* Prev arrow */}
        {multi && hasPrev && (
          <Pressable style={[styles.arrow, styles.arrowLeft]} onPress={prev} hitSlop={12}>
            <View style={styles.arrowBubble}>
              <FontAwesome name="chevron-left" size={18} color="#fff" />
            </View>
          </Pressable>
        )}

        {/* Next arrow */}
        {multi && hasNext && (
          <Pressable style={[styles.arrow, styles.arrowRight]} onPress={next} hitSlop={12}>
            <View style={styles.arrowBubble}>
              <FontAwesome name="chevron-right" size={18} color="#fff" />
            </View>
          </Pressable>
        )}

        {/* Dot indicators + thumbnail strip */}
        {multi && (
          <View style={styles.footer}>
            {/* Dot row */}
            <View style={styles.dots}>
              {images.map((_, i) => (
                <Pressable key={i} onPress={() => setIndex(i)}>
                  <View style={[styles.dot, i === index && styles.dotActive]} />
                </Pressable>
              ))}
            </View>

            {/* Thumbnail strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
            >
              {images.map((uri, i) => (
                <Pressable key={i} onPress={() => setIndex(i)}>
                  <Image
                    source={{ uri }}
                    style={[styles.thumb, i === index && styles.thumbActive]}
                    resizeMode="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
  },
  counter: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: 360,
    height: 400,
    maxWidth: '100%' as any,
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  arrowBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 20,
  },
  thumbRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    opacity: 0.55,
  },
  thumbActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
