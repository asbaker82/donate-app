import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  size?: number;
}

const TANGERINE = '#F26B3A';
const INK = '#1F1A17';

// Three horizontal speed lines (short/long/medium) stacked in a column,
// each offset from the left to create the staggered speed-line look.
// Uses normal flow layout (no absolute positioning) so it renders reliably
// inside tab and stack headers.
export default function HeaderLogo({ size = 22 }: Props) {
  const yoinkSize = size * 1.08;
  const itSize    = size * 0.72;

  // Bar dimensions proportional to size
  const barH    = Math.max(2.5, size * 0.13);
  const barR    = barH / 2;
  const barGap  = Math.max(2, size * 0.11);
  const shortW  = size * 0.42;
  const longW   = size * 0.70;
  const medW    = size * 0.56;
  const longOff = size * 0.26;   // long bar indented from left
  const medOff  = size * 0.04;   // medium bar slight indent

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* Speed lines block */}
      <View style={{ flexDirection: 'column', justifyContent: 'center', marginRight: size * 0.32 }}>
        <View style={{ width: shortW, height: barH, borderRadius: barR, backgroundColor: TANGERINE, opacity: 0.45, marginBottom: barGap }} />
        <View style={{ width: longW,  height: barH, borderRadius: barR, backgroundColor: TANGERINE, opacity: 0.75, marginBottom: barGap, marginLeft: longOff }} />
        <View style={{ width: medW,   height: barH, borderRadius: barR, backgroundColor: TANGERINE, opacity: 0.55, marginLeft: medOff }} />
      </View>

      {/* Wordmark */}
      <Text
        style={{
          fontFamily: 'BricolageGrotesque_800ExtraBold',
          fontSize: yoinkSize,
          fontStyle: 'italic',
          color: INK,
          includeFontPadding: false,
        }}
      >
        Yoink
      </Text>
      <Text
        style={{
          fontFamily: 'BricolageGrotesque_800ExtraBold',
          fontSize: itSize,
          fontStyle: 'italic',
          color: TANGERINE,
          includeFontPadding: false,
          marginLeft: size * 0.15,
        }}
      >
        it!
      </Text>
    </View>
  );
}
