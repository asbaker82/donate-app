import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// Zero-padded helpers that avoid timezone shifts
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function todayISO() {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth(), t.getDate());
}
function parseISO(s: string): { y: number; m: number; d: number } | null {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  if (m < 0 || m > 11 || d < 1 || d > 31) return null;
  return { y, m, d };
}
function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const p = parseISO(iso);
  if (!p) return iso;
  return `${String(p.m + 1).padStart(2,'0')}-${String(p.d).padStart(2,'0')}-${p.y}`;
}
function tryParseLoose(s: string): string | null {
  // Primary: MM-DD-YYYY or M-D-YYYY
  const mdy_dash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdy_dash) return toISO(parseInt(mdy_dash[3],10), parseInt(mdy_dash[1],10)-1, parseInt(mdy_dash[2],10));
  // Also accept MM/DD/YYYY, M/D/YYYY
  const mdy_slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy_slash) return toISO(parseInt(mdy_slash[3],10), parseInt(mdy_slash[1],10)-1, parseInt(mdy_slash[2],10));
  // Fallback: YYYY-MM-DD (ISO, backward compat)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return s;
  return null;
}

function buildGrid(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  type Cell = { iso: string; day: number; cur: boolean };
  const cells: Cell[] = [];

  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ iso: toISO(py, pm, d), day: d, cur: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toISO(year, month, d), day: d, cur: true });
  }
  const fill = 42 - cells.length;
  for (let d = 1; d <= fill; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    cells.push({ iso: toISO(ny, nm, d), day: d, cur: false });
  }
  return cells;
}

interface Props {
  value: string;       // YYYY-MM-DD or ''
  onChange: (iso: string) => void;
  placeholder?: string;
  dropUp?: boolean;    // open calendar upward instead of downward
}

export default function DatePickerInput({ value, onChange, placeholder, dropUp }: Props) {
  const now = new Date();
  const parsed = parseISO(value);
  const [text, setText] = useState(() => isoToDisplay(value));
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(parsed?.y ?? now.getFullYear());
  const [viewM, setViewM] = useState(parsed?.m ?? now.getMonth());

  const today = todayISO();

  const pickDay = (iso: string) => {
    const p = parseISO(iso);
    if (!p) return;
    onChange(iso);
    setText(isoToDisplay(iso));
    setViewY(p.y);
    setViewM(p.m);
    setOpen(false);
  };

  const handleTextChange = (t: string) => {
    setText(t);
    const iso = tryParseLoose(t);
    if (iso) {
      onChange(iso);
      const p = parseISO(iso);
      if (p) { setViewY(p.y); setViewM(p.m); }
    } else {
      onChange(t); // pass through; form validates on submit
    }
  };

  const prevMonth = () => {
    if (viewM === 0) { setViewM(11); setViewY(y => y - 1); }
    else setViewM(m => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) { setViewM(0); setViewY(y => y + 1); }
    else setViewM(m => m + 1);
  };

  const cells = buildGrid(viewY, viewM);

  const calendarInner = (
    <>
      {/* Month navigation */}
      <View style={styles.navRow}>
        <Pressable style={styles.navBtn} onPress={prevMonth}>
          <FontAwesome name="chevron-left" size={13} color="#2d3748" />
        </Pressable>
        <Text style={styles.navTitle}>{MONTHS[viewM]} {viewY}</Text>
        <Pressable style={styles.navBtn} onPress={nextMonth}>
          <FontAwesome name="chevron-right" size={13} color="#2d3748" />
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.dowRow}>
        {DOW.map(d => <Text key={d} style={styles.dowText}>{d}</Text>)}
      </View>

      {/* Day grid — 6 rows × 7 cols */}
      <View style={styles.grid}>
        {cells.map((cell, i) => {
          const isSelected = cell.iso === value;
          const isToday    = cell.iso === today;
          const isPast     = cell.iso < today;
          return (
            <Pressable
              key={i}
              style={[
                styles.cell,
                isSelected && styles.cellSelected,
                isToday && !isSelected && styles.cellToday,
                isPast && styles.cellPast,
              ]}
              onPress={() => !isPast && pickDay(cell.iso)}
              disabled={isPast}
            >
              <Text style={[
                styles.cellText,
                !cell.cur && styles.cellFaded,
                isSelected && styles.cellTextSelected,
                isToday && !isSelected && styles.cellTextToday,
                isPast && styles.cellTextPast,
              ]}>
                {cell.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Today shortcut */}
      <Pressable style={styles.todayBtn} onPress={() => pickDay(today)}>
        <Text style={styles.todayBtnText}>Today</Text>
      </Pressable>
    </>
  );

  // On web: inline absolute dropdown. On native: Modal overlay.
  return (
    <View style={styles.wrapper}>
      {/* Input row */}
      <View style={[styles.inputRow, open && styles.inputRowOpen]}>
        <FontAwesome name="calendar" size={15} color="#10B981" style={styles.calIcon} />
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholder={placeholder ?? 'MM-DD-YYYY'}
          placeholderTextColor="#a0aec0"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
        />
        <Pressable onPress={() => setOpen(o => !o)} style={styles.toggleBtn}>
          <FontAwesome
            name={open ? 'chevron-up' : 'chevron-down'}
            size={13}
            color="#718096"
          />
        </Pressable>
      </View>

      {Platform.OS === 'web' && !dropUp ? (
        open && (
          <>
            <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
            <View style={[styles.popupBase, styles.popupDropdown]}>
              {calendarInner}
            </View>
          </>
        )
      ) : (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
            <Pressable onPress={e => e.stopPropagation()}>
              <View style={styles.popupBase}>{calendarInner}</View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const CELL_SIZE = 36;
const CALENDAR_WIDTH = CELL_SIZE * 7 + 24; // 276 — fixed so it never stretches

const styles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    gap: 8,
  },
  inputRowOpen: { borderColor: '#10B981' },
  calIcon: { width: 18 },
  input: { flex: 1, fontSize: 15, color: '#2d3748' },
  toggleBtn: { padding: 4 },

  backdrop: {
    position: 'absolute',
    top: -9999,
    left: -9999,
    right: -9999,
    bottom: -9999,
    zIndex: 19,
  },
  popupBase: {
    width: CALENDAR_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    padding: 12,
  },
  popupDropdown: {
    position: 'absolute',
    left: 0,
    top: '100%' as any,
    marginTop: 4,
    zIndex: 30,
  },
  // Native/dropUp Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  navBtn: { padding: 8 },
  navTitle: { fontSize: 15, fontWeight: '700', color: '#1a202c' },

  dowRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dowText: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#a0aec0',
    textTransform: 'uppercase',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CELL_SIZE / 2,
  },
  cellSelected: { backgroundColor: '#10B981' },
  cellToday: { backgroundColor: '#ECFDF5', borderWidth: 1.5, borderColor: '#10B981' },
  cellText: { fontSize: 13, color: '#2d3748', fontWeight: '500' },
  cellFaded: { color: '#cbd5e0' },
  cellTextSelected: { color: '#fff', fontWeight: '700' },
  cellTextToday: { color: '#10B981', fontWeight: '700' },
  cellPast: { opacity: 0.3 },
  cellTextPast: { color: '#a0aec0' },

  todayBtn: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  todayBtnText: { fontSize: 13, color: '#10B981', fontWeight: '700' },
});
