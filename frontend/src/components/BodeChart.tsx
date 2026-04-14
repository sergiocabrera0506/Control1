import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';

interface Props {
  frequencies: number[];
  values: number[];
  color: string;
  label: string;
  showGrid: boolean;
  onCursorMove?: (index: number) => void;
}

export default function BodeChart({ frequencies, values, color, label, showGrid, onCursorMove }: Props) {
  const [dims, setDims] = useState({ w: 300, h: 200 });
  const [cursorIdx, setCursorIdx] = useState<number | null>(null);

  const p = { t: 15, r: 15, b: 25, l: 55 };
  const cw = dims.w - p.l - p.r;
  const ch = dims.h - p.t - p.b;

  if (!frequencies.length || cw <= 0 || ch <= 0) return <View style={styles.container} />;

  const logMin = Math.log10(Math.max(frequencies[0], 1e-10));
  const logMax = Math.log10(Math.max(frequencies[frequencies.length - 1], 1e-10));
  const logRange = logMax - logMin || 1;

  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const vRange = vMax - vMin || 1;
  const yMin = vMin - vRange * 0.1;
  const yMax = vMax + vRange * 0.1;
  const yRange = yMax - yMin;

  const fToX = (f: number) => p.l + ((Math.log10(Math.max(f, 1e-10)) - logMin) / logRange) * cw;
  const vToY = (v: number) => p.t + ch - ((v - yMin) / yRange) * ch;

  // Build path - sample if too many points for perf
  const step = Math.max(1, Math.floor(frequencies.length / 500));
  let pathD = '';
  for (let i = 0; i < frequencies.length; i += step) {
    const x = fToX(frequencies[i]);
    const y = vToY(values[i]);
    pathD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  // Always include last point
  if (frequencies.length > 1) {
    const last = frequencies.length - 1;
    pathD += ` L ${fToX(frequencies[last])} ${vToY(values[last])}`;
  }

  const grids: React.ReactElement[] = [];
  if (showGrid) {
    // Horizontal
    const yStep = yRange / 5;
    for (let i = 0; i <= 5; i++) {
      const val = yMin + i * yStep;
      const y = vToY(val);
      grids.push(
        <Line key={`h${i}`} x1={p.l} y1={y} x2={p.l + cw} y2={y} stroke={COLORS.gridLines} strokeWidth={1} />,
        <SvgText key={`hl${i}`} x={p.l - 4} y={y + 3} fill={COLORS.textSecondary} fontSize={8} fontFamily={FONTS.mono} textAnchor="end">
          {val.toFixed(0)}
        </SvgText>
      );
    }
    // Vertical decades
    const sd = Math.floor(logMin);
    const ed = Math.ceil(logMax);
    for (let d = sd; d <= ed; d++) {
      const x = fToX(Math.pow(10, d));
      if (x >= p.l && x <= p.l + cw) {
        grids.push(
          <Line key={`v${d}`} x1={x} y1={p.t} x2={x} y2={p.t + ch} stroke={COLORS.gridLines} strokeWidth={1} />
        );
      }
    }
  }

  const handleTouch = useCallback((evt: any) => {
    const x = evt.nativeEvent.locationX - p.l;
    if (x < 0 || x > cw || cw <= 0) return;
    const logF = logMin + (x / cw) * logRange;
    const targetF = Math.pow(10, logF);
    let lo = 0, hi = frequencies.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (frequencies[mid] < targetF) lo = mid + 1;
      else hi = mid;
    }
    setCursorIdx(lo);
    onCursorMove?.(lo);
  }, [frequencies, logMin, logRange, cw, onCursorMove]);

  return (
    <View
      testID={`bode-chart-${label.toLowerCase()}`}
      onLayout={e => setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={styles.container}
      onTouchMove={handleTouch}
      onTouchStart={handleTouch}
    >
      <Svg width={dims.w} height={dims.h}>
        <Line x1={p.l} y1={p.t} x2={p.l} y2={p.t + ch} stroke={COLORS.border} strokeWidth={1} />
        <Line x1={p.l} y1={p.t + ch} x2={p.l + cw} y2={p.t + ch} stroke={COLORS.border} strokeWidth={1} />
        {grids}
        <Path d={pathD} stroke={color} strokeWidth={2} fill="none" />
        {cursorIdx !== null && cursorIdx >= 0 && cursorIdx < frequencies.length && (
          <Line
            x1={fToX(frequencies[cursorIdx])} y1={p.t}
            x2={fToX(frequencies[cursorIdx])} y2={p.t + ch}
            stroke={COLORS.accentPrimary} strokeWidth={1} strokeDasharray="4,4"
          />
        )}
        <SvgText x={p.l + cw - 5} y={p.t + 12} fill={color} fontSize={10} fontFamily={FONTS.mono} textAnchor="end">
          {label}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    backgroundColor: COLORS.bgCard,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
