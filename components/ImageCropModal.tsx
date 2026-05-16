import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Web-only. For native, expo-image-picker's allowsEditing handles cropping.

const CROP_D = 280;  // display diameter of the crop circle
const OUTPUT  = 400; // output canvas resolution (square)

interface Props {
  imageUri: string;   // data URL of the raw picked image
  visible: boolean;
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropModal({ imageUri, visible, onConfirm, onCancel }: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoomPct, setZoomPct] = useState(100);

  const containerRef = useRef<any>(null);
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const imgRef       = useRef<HTMLImageElement | null>(null);
  const dragging     = useRef(false);
  const lastMouse    = useRef({ x: 0, y: 0 });

  // Mount canvas imperatively into the View's DOM node
  useEffect(() => {
    if (!containerRef.current) return;
    const domNode: HTMLElement = containerRef.current;
    const canvas = document.createElement('canvas');
    canvas.width  = CROP_D;
    canvas.height = CROP_D;
    canvas.style.cssText = `
      width:${CROP_D}px; height:${CROP_D}px;
      border-radius:50%; display:block; cursor:grab;
      user-select:none; -webkit-user-drag:none;
    `;
    domNode.appendChild(canvas);
    canvasRef.current = canvas;

    const onMouseDown = (e: MouseEvent) => {
      dragging.current = true;
      canvas.style.cursor = 'grabbing';
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    };
    const onMouseUp = () => {
      dragging.current = false;
      canvas.style.cursor = 'grab';
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale(s => {
        const next = Math.max(0.2, Math.min(5, s - e.deltaY * 0.001));
        setZoomPct(Math.round(next * 100));
        return next;
      });
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      domNode.removeChild(canvas);
      canvasRef.current = null;
    };
  }, []);

  // Load image when uri/visible changes; reset pan/zoom to fill circle
  useEffect(() => {
    if (!visible || !imageUri) return;
    const img = new (window as any).Image() as HTMLImageElement;
    img.onload = () => {
      imgRef.current = img;
      const fitScale = Math.max(CROP_D / img.width, CROP_D / img.height);
      setScale(fitScale);
      setZoomPct(Math.round(fitScale * 100));
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageUri;
  }, [visible, imageUri]);

  // Redraw canvas whenever image, scale, or offset changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width  = CROP_D;
    canvas.height = CROP_D;

    const iw = img.width  * scale;
    const ih = img.height * scale;
    const ix = (CROP_D - iw) / 2 + offset.x;
    const iy = (CROP_D - ih) / 2 + offset.y;

    ctx.clearRect(0, 0, CROP_D, CROP_D);
    ctx.drawImage(img, ix, iy, iw, ih);

    // Dark overlay with circular cutout
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.fillRect(0, 0, CROP_D, CROP_D);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(CROP_D / 2, CROP_D / 2, CROP_D / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CROP_D / 2, CROP_D / 2, CROP_D / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  }, [scale, offset]);

  const handleZoomBtn = (delta: number) => {
    setScale(s => {
      const next = Math.max(0.2, Math.min(5, s + delta));
      setZoomPct(Math.round(next * 100));
      return next;
    });
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement('canvas');
    out.width  = OUTPUT;
    out.height = OUTPUT;
    const ctx = out.getContext('2d')!;
    const r  = OUTPUT / CROP_D;
    const iw = img.width  * scale * r;
    const ih = img.height * scale * r;
    const ix = (OUTPUT - iw) / 2 + offset.x * r;
    const iy = (OUTPUT - ih) / 2 + offset.y * r;
    ctx.drawImage(img, ix, iy, iw, ih);
    onConfirm(out.toDataURL('image/jpeg', 0.85));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Crop Photo</Text>
          <Text style={styles.hint}>Drag to reposition · scroll to zoom</Text>

          {/* Canvas is injected imperatively into this View's DOM node */}
          <View
            ref={containerRef}
            style={styles.canvasWrap}
          />

          <View style={styles.zoomRow}>
            <Pressable style={styles.zoomBtn} onPress={() => handleZoomBtn(-0.1)}>
              <FontAwesome name="search-minus" size={17} color="#4a5568" />
            </Pressable>
            <Text style={styles.zoomLabel}>{zoomPct}%</Text>
            <Pressable style={styles.zoomBtn} onPress={() => handleZoomBtn(0.1)}>
              <FontAwesome name="search-plus" size={17} color="#4a5568" />
            </Pressable>
          </View>

          <View style={styles.btnRow}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Use Photo</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: 360,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#1a202c', marginBottom: 4 },
  hint: { fontSize: 13, color: '#a0aec0', marginBottom: 20 },
  canvasWrap: {
    width: CROP_D,
    height: CROP_D,
    borderRadius: CROP_D / 2,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomLabel: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '600',
    width: 52,
    textAlign: 'center',
  },
  btnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#4a5568' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
