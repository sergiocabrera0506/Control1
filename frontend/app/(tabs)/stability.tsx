import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../src/context/AppContext';
import { fmt } from '../../src/utils/formatters';
import { downloadBase64File } from '../../src/utils/fileExport';
import PoleZeroMap from '../../src/components/PoleZeroMap';
import { COLORS, FONTS } from '../../src/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function StabilityScreen() {
  const { result, numerator, denominator, config } = useAppContext();

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

  const exportPDF = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numerator, denominator,
          freq_min: config.freqMin, freq_max: config.freqMax, num_points: config.numPoints,
        }),
      });
      const data = await res.json();
      if (data.error) { Alert.alert('Error', data.error); return; }
      await downloadBase64File(data.pdf_base64, data.filename, 'application/pdf');
    } catch {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  if (!result) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.empty}>
          <Ionicons name="pulse-outline" size={48} color={COLORS.textSecondary} />
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
            <Ionicons name="pulse" size={20} color={COLORS.accentPrimary} />
            <Text style={s.headerTitle}> SYS_ARCHITECT</Text>
          </View>
        </View>

        {/* Section title */}
        <View style={s.secRow}>
          <Text style={s.secTitle}>POLE-ZERO MAP</Text>
          <Text style={s.secSub}>S-PLANE ANALYTICS</Text>
        </View>

        {/* Pole-Zero Map */}
        <PoleZeroMap poles={result.poles} zeros={result.zeros} />

        {/* Poles Table */}
        {result.poles.length > 0 && (
          <View testID="poles-table" style={s.tableCard}>
            <Text style={s.tableTitle}>POLES</Text>
            <View style={s.tableHeader}>
              <Text style={[s.tableHCol, { flex: 1 }]}>REAL</Text>
              <Text style={[s.tableHCol, { flex: 1 }]}>IMAGINARY</Text>
            </View>
            {result.poles.map((p, i) => (
              <View key={`p${i}`} style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1 }]}>{fmt(p.real, 4)}</Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{fmt(p.imag, 4)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Zeros Table */}
        {result.zeros.length > 0 && (
          <View testID="zeros-table" style={s.tableCard}>
            <Text style={s.tableTitle}>ZEROS</Text>
            <View style={s.tableHeader}>
              <Text style={[s.tableHCol, { flex: 1 }]}>REAL</Text>
              <Text style={[s.tableHCol, { flex: 1 }]}>IMAGINARY</Text>
            </View>
            {result.zeros.map((z, i) => (
              <View key={`z${i}`} style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1 }]}>{fmt(z.real, 4)}</Text>
                <Text style={[s.tableCell, { flex: 1 }]}>{fmt(z.imag, 4)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* System Health */}
        <View testID="system-health" style={[s.healthCard, { borderColor: result.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}>
          <View>
            <Text style={s.healthLabel}>SYSTEM HEALTH</Text>
            <Text style={[s.healthVal, { color: result.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}>
              {result.is_stable ? 'STABLE' : 'UNSTABLE'}
            </Text>
          </View>
          <View style={[s.healthIcon, { backgroundColor: result.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}>
            <Ionicons name={result.is_stable ? 'checkmark' : 'close'} size={24} color={COLORS.bgMain} />
          </View>
        </View>

        {/* Margins */}
        <View style={s.marginRow}>
          <View testID="stability-gain-margin" style={[s.marginCard, { borderBottomColor: COLORS.accentSecondary }]}>
            <Text style={s.marginLabel}>GAIN MARGIN</Text>
            <Text style={s.marginVal}>
              {result.gain_margin_db != null ? fmt(result.gain_margin_db, 1) : '∞'}
              <Text style={s.marginUnit}> dB</Text>
            </Text>
          </View>
          <View testID="stability-phase-margin" style={[s.marginCard, { borderBottomColor: COLORS.accentWarning }]}>
            <Text style={s.marginLabel}>PHASE MARGIN</Text>
            <Text style={s.marginVal}>
              {result.phase_margin_deg != null ? fmt(result.phase_margin_deg, 1) : '∞'}
              <Text style={s.marginUnit}> deg</Text>
            </Text>
          </View>
        </View>

        {/* Export Pipeline */}
        <Text style={s.exportTitle}>EXPORT PIPELINE</Text>
        <TouchableOpacity testID="download-csv-btn" style={s.exportBtn} onPress={exportCSV} activeOpacity={0.7}>
          <View style={[s.exportIcon, { backgroundColor: COLORS.accentPrimary + '22' }]}>
            <Ionicons name="grid-outline" size={20} color={COLORS.accentPrimary} />
          </View>
          <View style={s.exportInfo}>
            <Text style={s.exportBtnTitle}>Download CSV</Text>
            <Text style={s.exportBtnSub}>RAW TELEMETRY DATA</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity testID="generate-pdf-btn" style={s.exportBtn} onPress={exportPDF} activeOpacity={0.7}>
          <View style={[s.exportIcon, { backgroundColor: COLORS.accentDanger + '22' }]}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.accentDanger} />
          </View>
          <View style={s.exportInfo}>
            <Text style={s.exportBtnTitle}>Generate PDF Report</Text>
            <Text style={s.exportBtnSub}>FULL STABILITY ANALYSIS</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
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
  header: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  secTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700' },
  secSub: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1.5 },
  // Table
  tableCard: { backgroundColor: COLORS.bgCard, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginTop: 12 },
  tableTitle: { color: COLORS.accentSecondary, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4, marginBottom: 4 },
  tableHCol: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 4 },
  tableCell: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 13 },
  // Health
  healthCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: 8, borderWidth: 2, padding: 16, marginTop: 16 },
  healthLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  healthVal: { fontFamily: FONTS.mono, fontSize: 24, fontWeight: '700' },
  healthIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  // Margins
  marginRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  marginCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 4, borderBottomWidth: 3, padding: 16 },
  marginLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, marginBottom: 4 },
  marginVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 22, fontWeight: '700' },
  marginUnit: { fontSize: 14, fontWeight: '400', color: COLORS.textSecondary },
  // Export
  exportTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: 8, padding: 16, marginBottom: 8 },
  exportIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exportInfo: { flex: 1 },
  exportBtnTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 14, fontWeight: '700' },
  exportBtnSub: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, marginTop: 2 },
});
