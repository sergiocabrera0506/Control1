import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Text as SvgText, G } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';

interface Props {
  time: number[];
  amplitude: number[];
  color: string;
  label: string;
  showGrid?: boolean;
}

export default function TimeChart({ time, amplitude, color, label, showGrid = true }: Props) {
  const [dims, setDims] = useState({ w: 300, h: 200 });
  const [cursorIdx, setCursorIdx] = useState<number | null>(null);

  const p = { t: 20, r: 15, b: 25, l: 55 };
  const cw = dims.w - p.l - p.r;
  const ch = dims.h - p.t - p.b;

  if (!time.length || cw <= 0 || ch <= 0) return <View style={styles.container} />;

  const tMin = time[0];
  const tMax = time[time.length - 1];
  const tRange = tMax - tMin || 1;
  const aMin = Math.min(...amplitude);
  const aMax = Math.max(...amplitude);
  const aRange = aMax - aMin || 1;
  const yMin = aMin - aRange * 0.1;
  const yMax = aMax + aRange * 0.1;
  const yRange = yMax - yMin;

  const tToX = (t: number) => p.l + ((t - tMin) / tRange) * cw;
  const aToY = (a: number) => p.t + ch - ((a - yMin) / yRange) * ch;

  // Build path
  const step = Math.max(1, Math.floor(time.length / 400));
  let pathD = '';
  for (let i = 0; i < time.length; i += step) {
    pathD += i === 0 ? `M ${tToX(time[i])} ${aToY(amplitude[i])}` : ` L ${tToX(time[i])} ${aToY(amplitude[i])}`;
  }
  const last = time.length - 1;
  if (last > 0) pathD += ` L ${tToX(time[last])} ${aToY(amplitude[last])}`;

  // Grid
  const grids: React.ReactElement[] = [];
  if (showGrid) {
    for (let i = 0; i <= 4; i++) {
      const val = yMin + (i / 4) * yRange;
      const y = aToY(val);
      grids.push(
        <Line key={`h${i}`} x1={p.l} y1={y} x2={p.l + cw} y2={y} stroke={COLORS.gridLines} strokeWidth={1} />,
        <SvgText key={`hl${i}`} x={p.l - 4} y={y + 3} fill={COLORS.textSecondary} fontSize={8} fontFamily={FONTS.mono} textAnchor="end">
          {val.toFixed(2)}
        </SvgText>
      );
    }
    for (let i = 0; i <= 5; i++) {
      const t = tMin + (i / 5) * tRange;
      const x = tToX(t);
      grids.push(<Line key={`v${i}`} x1={x} y1={p.t} x2={x} y2={p.t + ch} stroke={COLORS.gridLines} strokeWidth={1} />);
    }
  }

  const ssY = aToY(amplitude[last]);

  const handleTouch = useCallback((evt: any) => {
    const ne = evt.nativeEvent || evt;
    const x = (ne.locationX ?? ne.offsetX ?? 0) - p.l;
    if (x < 0 || x > cw || cw <= 0) return;
    const targetT = tMin + (x / cw) * tRange;
    let lo = 0, hi = time.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (time[mid] < targetT) lo = mid + 1; else hi = mid; }
    setCursorIdx(lo);
  }, [time, tMin, tRange, cw]);

  const clearCursor = useCallback(() => { setCursorIdx(null); }, []);

  // MATLAB-style cursor
  const renderCursor = () => {
    if (cursorIdx === null || cursorIdx < 0 || cursorIdx >= time.length) return null;
    const cx = tToX(time[cursorIdx]);
    const cy = aToY(amplitude[cursorIdx]);
    const tVal = time[cursorIdx];
    const aVal = amplitude[cursorIdx];

    const tStr = `t=${tVal.toFixed(3)}s`;
    const aStr = `y=${aVal.toFixed(4)}`;
    const tooltipText = `${tStr} | ${aStr}`;
    const tooltipW = Math.min(tooltipText.length * 6 + 16, cw * 0.8);
    const tooltipH = 22;

    let tx = cx + 8;
    if (tx + tooltipW > p.l + cw) tx = cx - tooltipW - 8;
    let ty = cy - tooltipH - 8;
    if (ty < p.t) ty = cy + 8;

    return (
      <G>
        <Line x1={cx} y1={p.t} x2={cx} y2={p.t + ch} stroke={COLORS.accentPrimary} strokeWidth={1} strokeDasharray="3,3" opacity={0.7} />
        <Line x1={p.l} y1={cy} x2={p.l + cw} y2={cy} stroke={COLORS.accentPrimary} strokeWidth={1} strokeDasharray="3,3" opacity={0.7} />
        <Circle cx={cx} cy={cy} r={5} fill={color} stroke={COLORS.textPrimary} strokeWidth={2} />
        <Rect x={tx} y={ty} width={tooltipW} height={tooltipH} rx={4} fill={COLORS.bgMain} stroke={color} strokeWidth={1} opacity={0.95} />
        <SvgText x={tx + 8} y={ty + 15} fill={COLORS.textPrimary} fontSize={10} fontFamily={FONTS.mono}>
          {tooltipText}
        </SvgText>
      </G>
    );
  };

  return (
    <View
      testID={`time-chart-${label.toLowerCase().replace(/\s/g, '-')}`}
      onLayout={e => setDims({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={styles.container}
      onTouchMove={handleTouch}
      onTouchStart={handleTouch}
      onTouchEnd={clearCursor}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      // @ts-ignore - web compatibility
      onMouseMove={handleTouch}
      onMouseDown={handleTouch}
      onMouseLeave={clearCursor}
    >
      <Svg width={dims.w} height={dims.h}>
        <Line x1={p.l} y1={p.t} x2={p.l} y2={p.t + ch} stroke={COLORS.border} strokeWidth={1} />
        <Line x1={p.l} y1={p.t + ch} x2={p.l + cw} y2={p.t + ch} stroke={COLORS.border} strokeWidth={1} />
        {grids}
        <Line x1={p.l} y1={ssY} x2={p.l + cw} y2={ssY} stroke={COLORS.textSecondary} strokeWidth={0.5} strokeDasharray="4,4" />
        <Path d={pathD} stroke={color} strokeWidth={2} fill="none" />
        {renderCursor()}
        <SvgText x={p.l + cw - 5} y={p.t + 12} fill={color} fontSize={10} fontFamily={FONTS.mono} textAnchor="end">
          {label}
        </SvgText>
        <SvgText x={p.l + cw / 2} y={p.t + ch + 18} fill={COLORS.textSecondary} fontSize={8} fontFamily={FONTS.mono} textAnchor="middle">
          TIEMPO (s)
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
