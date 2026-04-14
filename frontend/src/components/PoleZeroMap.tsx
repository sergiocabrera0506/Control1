import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';

interface CN { real: number; imag: number; }
interface Props { poles: CN[]; zeros: CN[]; }

export default function PoleZeroMap({ poles, zeros }: Props) {
  const [dims, setDims] = useState({ w: 300, h: 300 });
  const pad = 40;
  const cw = dims.w - 2 * pad;
  const ch = dims.h - 2 * pad;

  const all = [...poles, ...zeros];
  if (all.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>No poles or zeros</Text>
      </View>
    );
  }

  const maxR = Math.max(...all.map(p => Math.abs(p.real)), 1);
  const maxI = Math.max(...all.map(p => Math.abs(p.imag)), 1);
  const range = Math.max(maxR, maxI) * 1.4;

  const toX = (r: number) => pad + ((r + range) / (2 * range)) * cw;
  const toY = (i: number) => pad + ch - ((i + range) / (2 * range)) * ch;
  const ucR = (1 / (2 * range)) * Math.min(cw, ch);

  return (
    <View
      testID="pole-zero-map"
      onLayout={e => setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={styles.container}
    >
      <Svg width={dims.w} height={dims.h}>
        {/* Grid */}
        {[-range, -range / 2, 0, range / 2, range].map((v, i) => (
          <G key={`g${i}`}>
            <Line x1={toX(v)} y1={pad} x2={toX(v)} y2={pad + ch} stroke={COLORS.gridLines} strokeWidth={0.5} />
            <Line x1={pad} y1={toY(v)} x2={pad + cw} y2={toY(v)} stroke={COLORS.gridLines} strokeWidth={0.5} />
          </G>
        ))}
        {/* Axes */}
        <Line x1={pad} y1={toY(0)} x2={pad + cw} y2={toY(0)} stroke={COLORS.border} strokeWidth={1} />
        <Line x1={toX(0)} y1={pad} x2={toX(0)} y2={pad + ch} stroke={COLORS.border} strokeWidth={1} />
        {/* Unit circle */}
        <Circle cx={toX(0)} cy={toY(0)} r={ucR} stroke={COLORS.textSecondary} strokeWidth={1} strokeDasharray="4,4" fill="none" />
        {/* Zeros (O) */}
        {zeros.map((z, i) => (
          <Circle key={`z${i}`} cx={toX(z.real)} cy={toY(z.imag)} r={8} stroke={COLORS.accentSecondary} strokeWidth={2.5} fill="none" />
        ))}
        {/* Poles (X) */}
        {poles.map((p, i) => (
          <G key={`p${i}`}>
            <Line x1={toX(p.real) - 7} y1={toY(p.imag) - 7} x2={toX(p.real) + 7} y2={toY(p.imag) + 7} stroke={COLORS.accentPrimary} strokeWidth={2.5} />
            <Line x1={toX(p.real) + 7} y1={toY(p.imag) - 7} x2={toX(p.real) - 7} y2={toY(p.imag) + 7} stroke={COLORS.accentPrimary} strokeWidth={2.5} />
          </G>
        ))}
        {/* Labels */}
        <SvgText x={pad + cw - 5} y={toY(0) - 5} fill={COLORS.textSecondary} fontSize={9} fontFamily={FONTS.mono} textAnchor="end">
          REAL
        </SvgText>
        <SvgText x={toX(0) + 5} y={pad + 12} fill={COLORS.textSecondary} fontSize={9} fontFamily={FONTS.mono}>
          IMAG (j{'\u03C9'})
        </SvgText>
      </Svg>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Text style={[styles.legendSymbol, { color: COLORS.accentPrimary }]}>x</Text>
          <Text style={styles.legendText}>POLES</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.legendSymbol, { color: COLORS.accentSecondary }]}>o</Text>
          <Text style={styles.legendText}>ZEROS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: COLORS.bgCard,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  empty: {
    color: COLORS.textSecondary,
    fontFamily: FONTS.mono,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 130,
  },
  legend: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    flexDirection: 'row',
    gap: 16,
    backgroundColor: COLORS.bgCard + 'DD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSymbol: { fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700' },
  legendText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.textSecondary, letterSpacing: 1 },
});
