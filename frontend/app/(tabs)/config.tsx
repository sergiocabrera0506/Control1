import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../src/context/AppContext';
import { COLORS, FONTS } from '../../src/theme';

const POINT_OPTIONS = [512, 1024, 2048];

export default function ConfigScreen() {
  const { config, setConfig } = useAppContext();

  const update = (key: string, value: any) => setConfig({ ...config, [key]: value });

  const reset = () => setConfig({
    freqMin: 0.01, freqMax: 100000, numPoints: 1024,
    showGrid: true, showAsymptotes: false, showPhaseMarkers: true,
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={s.header}>
            <View>
              <View style={s.row}>
                <Ionicons name="hardware-chip" size={20} color={COLORS.accentPrimary} />
                <Text style={s.headerTitle}> ENGINEER_CORE</Text>
              </View>
              <Text style={s.configTitle}>CONFIG</Text>
            </View>
            <View style={s.statusBox}>
              <Text style={s.statusLabel}>SYSTEM STATUS</Text>
              <Text style={s.statusVal}>OPTIMIZED_V3.4</Text>
            </View>
          </View>

          {/* Frequency Range */}
          <View testID="freq-range-card" style={s.card}>
            <View style={s.cardRow}>
              <Text style={s.cardTitle}>FREQUENCY RANGE</Text>
              <Text style={s.freqRange}>
                {config.freqMin}Hz — {config.freqMax >= 1000 ? `${config.freqMax / 1000}kHz` : `${config.freqMax}Hz`}
              </Text>
            </View>
            <View style={s.freqInputRow}>
              <View style={s.freqInputBox}>
                <Text style={s.miniLabel}>MIN (Hz)</Text>
                <TextInput
                  testID="freq-min-input"
                  style={s.freqInput}
                  value={String(config.freqMin)}
                  onChangeText={v => update('freqMin', parseFloat(v) || 0.01)}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <View style={s.freqInputBox}>
                <Text style={s.miniLabel}>MAX (Hz)</Text>
                <TextInput
                  testID="freq-max-input"
                  style={s.freqInput}
                  value={String(config.freqMax)}
                  onChangeText={v => update('freqMax', parseFloat(v) || 100000)}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>
            <View style={s.freqLabels}>
              <Text style={s.freqLabelText}>LOG_MIN</Text>
              <Text style={s.freqLabelText}>LOG_MAX</Text>
            </View>
          </View>

          {/* Point Density */}
          <Text style={s.sectionTitle}>POINT DENSITY (SAMPLES)</Text>
          <View testID="point-density-selector" style={s.pointRow}>
            {POINT_OPTIONS.map(n => (
              <TouchableOpacity
                key={n}
                testID={`point-${n}`}
                style={[s.pointBtn, config.numPoints === n && s.pointBtnActive]}
                onPress={() => update('numPoints', n)}
                activeOpacity={0.7}
              >
                <Text style={[s.pointText, config.numPoints === n && s.pointTextActive]}>{n}</Text>
                {config.numPoints === n && <Text style={s.optimum}>OPTIMUM</Text>}
              </TouchableOpacity>
            ))}
          </View>

          {/* Toggles */}
          <View style={s.card}>
            <View style={s.toggleRow}>
              <View style={s.row}>
                <Ionicons name="grid-outline" size={18} color={COLORS.accentSecondary} />
                <Text style={s.toggleLabel}> Show Grid</Text>
              </View>
              <Switch
                testID="toggle-grid"
                value={config.showGrid}
                onValueChange={v => update('showGrid', v)}
                trackColor={{ false: COLORS.border, true: COLORS.accentPrimary }}
                thumbColor={COLORS.textPrimary}
              />
            </View>
            <View style={s.divider} />
            <View style={s.toggleRow}>
              <View style={s.row}>
                <Ionicons name="trending-up-outline" size={18} color={COLORS.accentWarning} />
                <Text style={s.toggleLabel}> Asymptotes</Text>
              </View>
              <Switch
                testID="toggle-asymptotes"
                value={config.showAsymptotes}
                onValueChange={v => update('showAsymptotes', v)}
                trackColor={{ false: COLORS.border, true: COLORS.accentWarning }}
                thumbColor={COLORS.textPrimary}
              />
            </View>
            <View style={s.divider} />
            <View style={s.toggleRow}>
              <View style={s.row}>
                <Ionicons name="ellipse-outline" size={18} color={COLORS.accentSecondary} />
                <Text style={s.toggleLabel}> Phase Markers</Text>
              </View>
              <Switch
                testID="toggle-phase-markers"
                value={config.showPhaseMarkers}
                onValueChange={v => update('showPhaseMarkers', v)}
                trackColor={{ false: COLORS.border, true: COLORS.accentPrimary }}
                thumbColor={COLORS.textPrimary}
              />
            </View>
          </View>

          {/* Latency */}
          <View testID="latency-card" style={[s.card, { borderLeftWidth: 3, borderLeftColor: COLORS.accentPrimary }]}>
            <View style={s.cardRow}>
              <View>
                <Text style={s.latencyLabel}>CALCULATION LATENCY</Text>
                <Text style={s.latencyVal}>0.042 <Text style={s.latencyUnit}>ms</Text></Text>
              </View>
              <Ionicons name="flash" size={22} color={COLORS.accentPrimary} />
            </View>
          </View>

          {/* Reset */}
          <TouchableOpacity testID="reset-defaults-btn" style={s.resetBtn} onPress={reset} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={COLORS.textSecondary} />
            <Text style={s.resetText}> Reset to Default</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  configTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 28, fontWeight: '700', marginTop: 8 },
  statusBox: { alignItems: 'flex-end' },
  statusLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5 },
  statusVal: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  // Card
  card: { backgroundColor: COLORS.bgCard, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  freqRange: { color: COLORS.accentSecondary, fontFamily: FONTS.mono, fontSize: 13 },
  freqInputRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  freqInputBox: { flex: 1 },
  miniLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, marginBottom: 4 },
  freqInput: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700', borderBottomWidth: 2, borderBottomColor: COLORS.border, paddingBottom: 4, padding: 0 },
  freqLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  freqLabelText: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5 },
  // Points
  sectionTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  pointRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  pointBtn: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 16, alignItems: 'center' },
  pointBtnActive: { borderColor: COLORS.accentPrimary, borderWidth: 2 },
  pointText: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700' },
  pointTextActive: { color: COLORS.accentPrimary },
  optimum: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, marginTop: 4 },
  // Toggles
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  toggleLabel: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
  // Latency
  latencyLabel: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  latencyVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 24, fontWeight: '700' },
  latencyUnit: { fontSize: 14, fontWeight: '400', color: COLORS.textSecondary },
  // Reset
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgCard, borderRadius: 8, paddingVertical: 16, marginTop: 4 },
  resetText: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 14 },
});
