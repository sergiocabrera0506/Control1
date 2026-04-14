import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../src/context/AppContext';
import { formatFrequency, fmt } from '../../src/utils/formatters';
import { downloadBase64File } from '../../src/utils/fileExport';
import BodeChart from '../../src/components/BodeChart';
import { COLORS, FONTS } from '../../src/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AnalyzeScreen() {
  const { result, cursor, setCursor, numerator, denominator, config } = useAppContext();

  const handleCursorMove = (index: number) => {
    if (!result) return;
    setCursor({
      frequency: result.frequencies[index],
      magnitude: result.magnitude_db[index],
      phase: result.phase_deg[index],
    });
  };

  const exportCSV = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/export/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numerator, denominator,
          freq_min: config.freqMin, freq_max: config.freqMax, num_points: config.numPoints,
        }),
      });
      const data = await res.json();
      if (data.error) { Alert.alert('Error', data.error); return; }
      await downloadBase64File(data.csv_base64, data.filename, 'text/csv');
    } catch {
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  if (!result) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.empty}>
          <Ionicons name="analytics-outline" size={48} color={COLORS.textSecondary} />
          <Text style={s.emptyText}>RUN A SIMULATION FIRST</Text>
          <Text style={s.emptyHint}>Go to FUNCTION tab and press RUN_SIMULATION</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.flex} contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.row}>
            <Ionicons name="hardware-chip" size={20} color={COLORS.accentPrimary} />
            <Text style={s.headerTitle}> ENGINEER_CORE</Text>
          </View>
          <View style={[s.stableBadge, { borderColor: result.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}>
            <Text style={[s.stableText, { color: result.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}>
              {result.is_stable ? 'STABLE' : 'UNSTABLE'}
            </Text>
          </View>
        </View>

        {/* Cursor Tracking */}
        <View testID="cursor-tracking-card" style={s.cursorCard}>
          <Text style={s.label}>CURSOR TRACKING</Text>
          <Text style={s.probeTitle}>ACTIVE_PROBE_01</Text>
          <View style={s.cursorRow}>
            <View style={s.cursorCol}>
              <Text style={s.cursorLabel}>FREQUENCY</Text>
              <Text style={s.cursorVal}>{cursor ? formatFrequency(cursor.frequency) : '—'}</Text>
            </View>
            <View style={s.cursorCol}>
              <Text style={s.cursorLabel}>MAGNITUDE</Text>
              <Text style={[s.cursorVal, { color: COLORS.accentSecondary }]}>
                {cursor ? `${fmt(cursor.magnitude)} dB` : '—'}
              </Text>
            </View>
          </View>
          <Text style={s.cursorLabel}>PHASE</Text>
          <Text style={[s.cursorVal, { color: COLORS.accentWarning }]}>
            {cursor ? `${fmt(cursor.phase)} deg` : '—'}
          </Text>
        </View>

        {/* Magnitude Plot */}
        <BodeChart
          frequencies={result.frequencies}
          values={result.magnitude_db}
          color={COLORS.accentSecondary}
          label="MAGNITUDE"
          showGrid={config.showGrid}
          onCursorMove={handleCursorMove}
        />

        {/* Phase Plot */}
        <View style={{ marginTop: 12 }}>
          <BodeChart
            frequencies={result.frequencies}
            values={result.phase_deg}
            color={COLORS.accentPrimary}
            label="PHASE"
            showGrid={config.showGrid}
            onCursorMove={handleCursorMove}
          />
        </View>

        {/* Metrics */}
        {result.gain_margin_db != null && (
          <View testID="gain-margin-pill" style={[s.pill, { borderLeftColor: COLORS.accentSecondary }]}>
            <Text style={s.pillLabel}>GAIN MARGIN</Text>
            <Text style={s.pillVal}>{fmt(result.gain_margin_db)} <Text style={s.pillUnit}>dB</Text></Text>
          </View>
        )}
        {result.phase_margin_deg != null && (
          <View testID="phase-margin-pill" style={[s.pill, { borderLeftColor: COLORS.accentWarning }]}>
            <Text style={s.pillLabel}>PHASE MARGIN</Text>
            <Text style={s.pillVal}>{fmt(result.phase_margin_deg)} <Text style={s.pillUnit}>deg</Text></Text>
          </View>
        )}
        {result.gain_crossover_freq != null && (
          <View testID="unity-gain-pill" style={[s.pill, { borderLeftColor: COLORS.accentPrimary }]}>
            <Text style={s.pillLabel}>UNITY GAIN</Text>
            <Text style={s.pillVal}>{formatFrequency(result.gain_crossover_freq)}</Text>
          </View>
        )}

        {/* Export CSV */}
        <TouchableOpacity testID="export-csv-btn" style={s.exportBtn} onPress={exportCSV} activeOpacity={0.7}>
          <Ionicons name="download-outline" size={18} color={COLORS.accentPrimary} />
          <Text style={s.exportText}> EXPORT_CSV</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 14, marginTop: 12, letterSpacing: 1 },
  emptyHint: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 11, marginTop: 8, opacity: 0.6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  stableBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  stableText: { fontFamily: FONTS.mono, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  // Cursor
  cursorCard: { backgroundColor: COLORS.bgCard, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.accentSecondary },
  label: { color: COLORS.accentSecondary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  probeTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cursorRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cursorCol: { flex: 1 },
  cursorLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, marginBottom: 2 },
  cursorVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700' },
  // Pills
  pill: { backgroundColor: COLORS.bgCard, borderRadius: 24, borderLeftWidth: 4, padding: 16, marginTop: 12 },
  pillLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  pillVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 22, fontWeight: '700' },
  pillUnit: { fontSize: 14, color: COLORS.accentSecondary, fontWeight: '400' },
  // Export
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accentPrimary, borderRadius: 8, paddingVertical: 14, marginTop: 16 },
  exportText: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});
