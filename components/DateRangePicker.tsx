import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DOW = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function todayISO() {
  const t = new Date();
  return toISO(t.getFullYear(), t.getMonth(), t.getDate());
}
function parseISO(s: string) {
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { y: parseInt(match[1],10), m: parseInt(match[2],10)-1, d: parseInt(match[3],10) };
}
function formatShort(iso: string) {
  if (!iso) return '';
  const p = parseISO(iso);
  if (!p) return iso;
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function buildGrid(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  type Cell = { iso: string; day: number; cur: boolean };
  const cells: Cell[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    cells.push({ iso: toISO(month === 0 ? year-1 : year, month === 0 ? 11 : month-1, d), day: d, cur: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toISO(year, month, d), day: d, cur: true });
  }
  const fill = 42 - cells.length;
  for (let d = 1; d <= fill; d++) {
    cells.push({ iso: toISO(month === 11 ? year+1 : year, month === 11 ? 0 : month+1, d), day: d, cur: false });
  }
  return cells;
}

interface Props {
  startDate: string; // YYYY-MM-DD or ''
  endDate: string;   // YYYY-MM-DD or ''
  onChange: (start: string, end: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onChange }: Props) {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(now.getFullYear());
  const [viewM, setViewM] = useState(now.getMonth());
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');

  const today = todayISO();
  const cells = buildGrid(viewY, viewM);

  const handleOpen = () => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
    setOpen(true);
  };

  const handleDayPress = (iso: string) => {
    if (iso < today) return;
    if (!draftStart || draftEnd) {
      setDraftStart(iso);
      setDraftEnd('');
    } else if (iso <= draftStart) {
      setDraftStart(iso);
      setDraftEnd('');
    } else {
      onChange(draftStart, iso);
      setOpen(false);
    }
  };

  const prevMonth = () => {
    if (viewM === 0) { setViewM(11); setViewY(y => y - 1); } else setViewM(m => m - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) { setViewM(0); setViewY(y => y + 1); } else setViewM(m => m + 1);
  };

  const displayText = startDate && endDate
    ? `${formatShort(startDate)}  –  ${formatShort(endDate)}`
    : 'Select dates';

  return (
    <View>
      <Pressable style={[styles.trigger, open && styles.triggerOpen]} onPress={handleOpen}>
        <FontAwesome name="calendar" size={15} color="#10B981" style={{ width: 18 }} />
        <Text style={[styles.triggerText, !(startDate && endDate) && styles.triggerPlaceholder]}>
          {displayText}
        </Text>
        <FontAwesome name="chevron-down" size={13} color="#718096" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={styles.calendar}>

              {/* Navigation */}
              <View style={styles.navRow}>
                <Pressable style={styles.navBtn} onPress={prevMonth}>
                  <FontAwesome name="chevron-left" size={13} color="#2d3748" />
                </Pressable>
                <Text style={styles.navTitle}>{MONTHS[viewM]} {viewY}</Text>
                <Pressable style={styles.navBtn} onPress={nextMonth}>
                  <FontAwesome name="chevron-right" size={13} color="#2d3748" />
                </Pressable>
              </View>

              {/* Hint */}
              <Text style={styles.hint}>
                {!draftStart || draftEnd ? 'Tap a start date' : 'Tap a return date'}
              </Text>

              {/* DOW headers */}
              <View style={styles.dowRow}>
                {DOW.map(d => <Text key={d} style={styles.dowText}>{d}</Text>)}
              </View>

              {/* Grid */}
              <View style={styles.grid}>
                {cells.map((cell, i) => {
                  const isStart   = cell.iso === draftStart;
                  const isEnd     = cell.iso === draftEnd;
                  const hasRange  = !!(draftStart && draftEnd);
                  const isInRange = hasRange && cell.iso > draftStart && cell.iso < draftEnd;
                  const isPast    = cell.iso < today;
                  const col       = i % 7;

                  const showBar     = (hasRange && isStart) || isInRange || isEnd;
                  const barLeft     = isEnd ? 0 : CELL_SIZE / 2;
                  const barRight    = isStart ? 0 : CELL_SIZE / 2;

                  return (
                    <View key={i} style={styles.cellWrapper}>
                      {showBar && (
                        <View style={[styles.rangeBar, { left: barLeft, right: barRight }]} />
                      )}
                      <Pressable
                        style={[
                          styles.cell,
                          (isStart || isEnd) && styles.cellSelected,
                          !isStart && !isEnd && cell.iso === today && styles.cellToday,
                          isPast && styles.cellPast,
                        ]}
                        onPress={() => handleDayPress(cell.iso)}
                        disabled={isPast}
                      >
                        <Text style={[
                          styles.cellText,
                          !cell.cur && styles.cellFaded,
                          (isStart || isEnd) && styles.cellTextSelected,
                          !isStart && !isEnd && cell.iso === today && styles.cellTextToday,
                          isPast && styles.cellTextPast,
                        ]}>
                          {cell.day}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {/* Footer */}
              <Pressable
                style={styles.clearBtn}
                onPress={() => { setDraftStart(''); setDraftEnd(''); onChange('', ''); }}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>

            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const CELL_SIZE = 36;
const CALENDAR_WIDTH = CELL_SIZE * 7 + 24;

const styles = StyleSheet.create({
  trigger: {
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
  triggerOpen: { borderColor: '#10B981' },
  triggerText: { flex: 1, fontSize: 15, color: '#2d3748' },
  triggerPlaceholder: { color: '#a0aec0' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  calendar: {
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

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  navBtn: { padding: 8 },
  navTitle: { fontSize: 15, fontWeight: '700', color: '#1a202c' },

  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#a0aec0',
    marginBottom: 8,
  },

  dowRow: { flexDirection: 'row', marginBottom: 4 },
  dowText: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#a0aec0',
    textTransform: 'uppercase',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  cellWrapper: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBar: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: '#D1FAE5',
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
  cellPast: { opacity: 0.3 },
  cellText: { fontSize: 13, color: '#2d3748', fontWeight: '500' },
  cellFaded: { color: '#cbd5e0' },
  cellTextSelected: { color: '#fff', fontWeight: '700' },
  cellTextToday: { color: '#10B981', fontWeight: '700' },
  cellTextPast: { color: '#a0aec0' },

  clearBtn: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  clearBtnText: { fontSize: 13, color: '#10B981', fontWeight: '700' },
});
