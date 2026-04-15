import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../src/context/AppContext';
import { formatFrequency, fmt } from '../../src/utils/formatters';
import { downloadBase64File } from '../../src/utils/fileExport';
import BodeChart from '../../src/components/BodeChart';
import TimeChart from '../../src/components/TimeChart';
import { COLORS, FONTS } from '../../src/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AnalyzeScreen() {
  const { result, cursor, setCursor, numerator, denominator, config, timeResponse } = useAppContext();
  const handleCursorMove = (i: number) => { if (!result) return; setCursor({ frequency: result.frequencies[i], magnitude: result.magnitude_db[i], phase: result.phase_deg[i] }); };

  const exportCSV = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/export/csv`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numerator, denominator, freq_min: config.freqMin, freq_max: config.freqMax, num_points: config.numPoints }) });
      const data = await res.json();
      if (data.error) { Alert.alert('Error', data.error); return; }
      await downloadBase64File(data.csv_base64, data.filename, 'text/csv');
    } catch { Alert.alert('Error', 'No se pudo exportar CSV'); }
  };

  if (!result) return (<SafeAreaView style={s.safe} edges={['top']}><View style={s.empty}><Ionicons name="analytics-outline" size={48} color={COLORS.textSecondary} /><Text style={s.emptyText}>EJECUTA UNA SIMULACIÓN PRIMERO</Text><Text style={s.emptyHint}>Ve a la pestaña FUNCIÓN y presiona EJECUTAR</Text></View></SafeAreaView>);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.flex} contentContainerStyle={s.content}>
        <View style={s.header}>
          <View style={s.row}><Ionicons name="hardware-chip" size={20} color={COLORS.accentPrimary} /><Text style={s.headerTitle}> NÚCLEO_ING</Text></View>
          <View style={[s.stableBadge, { borderColor: result.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}><Text style={[s.stableText, { color: result.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}>{result.is_stable ? 'ESTABLE' : 'INESTABLE'}</Text></View>
        </View>

        <View testID="cursor-tracking-card" style={s.cursorCard}>
          <Text style={s.label}>SEGUIMIENTO DE CURSOR</Text>
          <Text style={s.probeTitle}>SONDA_ACTIVA_01</Text>
          <View style={s.cursorRow}>
            <View style={s.cursorCol}><Text style={s.cursorLabel}>FRECUENCIA</Text><Text style={s.cursorVal}>{cursor ? formatFrequency(cursor.frequency) : '—'}</Text></View>
            <View style={s.cursorCol}><Text style={s.cursorLabel}>MAGNITUD</Text><Text style={[s.cursorVal, { color: COLORS.accentSecondary }]}>{cursor ? `${fmt(cursor.magnitude)} dB` : '—'}</Text></View>
          </View>
          <Text style={s.cursorLabel}>FASE</Text>
          <Text style={[s.cursorVal, { color: COLORS.accentWarning }]}>{cursor ? `${fmt(cursor.phase)} grados` : '—'}</Text>
        </View>

        <BodeChart frequencies={result.frequencies} values={result.magnitude_db} color={COLORS.accentSecondary} label="MAGNITUD" unit="dB" showGrid={config.showGrid} onCursorMove={handleCursorMove} />
        <View style={{ marginTop: 12 }}><BodeChart frequencies={result.frequencies} values={result.phase_deg} color={COLORS.accentPrimary} label="FASE" unit="°" showGrid={config.showGrid} onCursorMove={handleCursorMove} /></View>

        {result.gain_margin_db != null && (<View testID="gain-margin-pill" style={[s.pill, { borderLeftColor: COLORS.accentSecondary }]}><Text style={s.pillLabel}>MARGEN DE GANANCIA</Text><Text style={s.pillVal}>{fmt(result.gain_margin_db)} <Text style={s.pillUnit}>dB</Text></Text></View>)}
        {result.phase_margin_deg != null && (<View testID="phase-margin-pill" style={[s.pill, { borderLeftColor: COLORS.accentWarning }]}><Text style={s.pillLabel}>MARGEN DE FASE</Text><Text style={s.pillVal}>{fmt(result.phase_margin_deg)} <Text style={s.pillUnit}>grados</Text></Text></View>)}
        {result.gain_crossover_freq != null && (<View testID="unity-gain-pill" style={[s.pill, { borderLeftColor: COLORS.accentPrimary }]}><Text style={s.pillLabel}>GANANCIA UNITARIA</Text><Text style={s.pillVal}>{formatFrequency(result.gain_crossover_freq)}</Text></View>)}

        {timeResponse && (<>
          <View style={s.timeDivider}><View style={s.divLine} /><Text style={s.divText}>ANÁLISIS EN DOMINIO DEL TIEMPO</Text><View style={s.divLine} /></View>
          <TimeChart time={timeResponse.step.time} amplitude={timeResponse.step.amplitude} color={COLORS.accentSecondary} label="RESP. ESCALÓN" showGrid={config.showGrid} />
          <View style={{ marginTop: 12 }}><TimeChart time={timeResponse.impulse.time} amplitude={timeResponse.impulse.amplitude} color={COLORS.accentDanger} label="RESP. IMPULSO" showGrid={config.showGrid} /></View>
          <View testID="time-metrics" style={s.metricsGrid}>
            <View style={[s.metricCard, { borderTopColor: COLORS.accentSecondary }]}><Text style={s.metricLabel}>ESTADO ESTACIONARIO</Text><Text style={s.metricVal}>{fmt(timeResponse.metrics.steady_state, 3)}</Text></View>
            <View style={[s.metricCard, { borderTopColor: COLORS.accentDanger }]}><Text style={s.metricLabel}>SOBREIMPULSO</Text><Text style={s.metricVal}>{fmt(timeResponse.metrics.overshoot_pct, 1)}<Text style={s.metricUnit}> %</Text></Text></View>
            <View style={[s.metricCard, { borderTopColor: COLORS.accentPrimary }]}><Text style={s.metricLabel}>TIEMPO DE SUBIDA</Text><Text style={s.metricVal}>{timeResponse.metrics.rise_time != null ? fmt(timeResponse.metrics.rise_time, 3) : '—'}<Text style={s.metricUnit}> s</Text></Text></View>
            <View style={[s.metricCard, { borderTopColor: COLORS.accentWarning }]}><Text style={s.metricLabel}>TIEMPO ASENTAMIENTO</Text><Text style={s.metricVal}>{timeResponse.metrics.settling_time != null ? fmt(timeResponse.metrics.settling_time, 2) : '—'}<Text style={s.metricUnit}> s</Text></Text></View>
          </View>
        </>)}

        <TouchableOpacity testID="export-csv-btn" style={s.exportBtn} onPress={exportCSV} activeOpacity={0.7}><Ionicons name="download-outline" size={18} color={COLORS.accentPrimary} /><Text style={s.exportText}> EXPORTAR_CSV</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain }, flex: { flex: 1 }, content: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 14, marginTop: 12, letterSpacing: 1 },
  emptyHint: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 11, marginTop: 8, opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  stableBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  stableText: { fontFamily: FONTS.mono, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cursorCard: { backgroundColor: COLORS.bgCard, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.accentSecondary },
  label: { color: COLORS.accentSecondary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  probeTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cursorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, cursorCol: { flex: 1 },
  cursorLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, marginBottom: 2 },
  cursorVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700' },
  pill: { backgroundColor: COLORS.bgCard, borderRadius: 24, borderLeftWidth: 4, padding: 16, marginTop: 12 },
  pillLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  pillVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 22, fontWeight: '700' },
  pillUnit: { fontSize: 14, color: COLORS.accentSecondary, fontWeight: '400' },
  timeDivider: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 12, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  divText: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metricCard: { flexGrow: 1, flexBasis: '45%' as any, backgroundColor: COLORS.bgCard, borderRadius: 4, borderTopWidth: 3, padding: 12 },
  metricLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
  metricVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700' },
  metricUnit: { fontSize: 12, fontWeight: '400', color: COLORS.textSecondary },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accentPrimary, borderRadius: 8, paddingVertical: 14, marginTop: 16 },
  exportText: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
