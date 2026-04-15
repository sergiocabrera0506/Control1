import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext, HistoryEntry } from '../../src/context/AppContext';
import { formatPolynomial, fmt } from '../../src/utils/formatters';
import { COLORS, FONTS } from '../../src/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export default function HistoryScreen() {
  const { history, setHistory, setNumerator, setDenominator } = useAppContext();
  const [refreshing, setRefreshing] = React.useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history`);
      const data = await res.json();
      setHistory(data);
    } catch { /* ignore */ }
  }, [setHistory]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const deleteEntry = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/history/${id}`, { method: 'DELETE' });
      loadHistory();
    } catch { /* ignore */ }
  };

  const clearAll = () => {
    Alert.alert('Clear History', 'Delete all simulation history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/history`, { method: 'DELETE' });
            loadHistory();
          } catch { /* ignore */ }
        }
      },
    ]);
  };

  const loadSimulation = (entry: HistoryEntry) => {
    const num = [...Array(4 - entry.numerator.length).fill(0), ...entry.numerator];
    const den = [...Array(5 - entry.denominator.length).fill(0), ...entry.denominator];
    setNumerator(num.slice(-4));
    setDenominator(den.slice(-5));
    Alert.alert('Loaded', 'Coefficients loaded. Go to FUNCTION tab to run simulation.');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <View style={s.row}>
            <Ionicons name="time" size={20} color={COLORS.accentPrimary} />
            <Text style={s.headerTitle}> SIM_LOG</Text>
          </View>
          <Text style={s.subtitle}>SIMULATION HISTORY</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity testID="clear-history-btn" onPress={clearAll} style={s.clearBtn}>
            <Ionicons name="trash-outline" size={16} color={COLORS.accentDanger} />
            <Text style={s.clearText}> CLEAR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <View style={s.stat}>
          <Text style={s.statVal}>{history.length}</Text>
          <Text style={s.statLabel}>TOTAL RUNS</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statVal, { color: COLORS.accentPrimary }]}>
            {history.filter(h => h.is_stable).length}
          </Text>
          <Text style={s.statLabel}>STABLE</Text>
        </View>
        <View style={s.stat}>
          <Text style={[s.statVal, { color: COLORS.accentDanger }]}>
            {history.filter(h => !h.is_stable).length}
          </Text>
          <Text style={s.statLabel}>UNSTABLE</Text>
        </View>
      </View>

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accentPrimary} />}
      >
        {history.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="time-outline" size={48} color={COLORS.textSecondary} />
            <Text style={s.emptyText}>NO SIMULATIONS YET</Text>
            <Text style={s.emptyHint}>Run a simulation to see it here</Text>
          </View>
        ) : (
          <>
            {/* Timeline */}
            {history.map((entry, idx) => (
              <View key={entry.id} testID={`history-entry-${entry.id}`}>
                {/* Timeline connector */}
                <View style={s.timelineRow}>
                  <View style={s.timelineCol}>
                    <View style={[s.dot, { backgroundColor: entry.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]} />
                    {idx < history.length - 1 && <View style={s.line} />}
                  </View>

                  <TouchableOpacity style={s.card} onPress={() => loadSimulation(entry)} activeOpacity={0.7}>
                    {/* Card header */}
                    <View style={s.cardHeader}>
                      <View style={s.row}>
                        <View style={[s.orderPill, { backgroundColor: entry.is_stable ? COLORS.accentPrimary + '22' : COLORS.accentDanger + '22' }]}>
                          <Text style={[s.orderText, { color: entry.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}>
                            {entry.order}{entry.order === 1 ? 'st' : entry.order === 2 ? 'nd' : entry.order === 3 ? 'rd' : 'th'}
                          </Text>
                        </View>
                        <Text style={[s.stableTag, { color: entry.is_stable ? COLORS.accentPrimary : COLORS.accentDanger }]}>
                          {entry.is_stable ? 'STABLE' : 'UNSTABLE'}
                        </Text>
                      </View>
                      <TouchableOpacity testID={`delete-history-${entry.id}`} onPress={() => deleteEntry(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle-outline" size={18} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>

                    {/* TF formula */}
                    <Text style={s.formula} numberOfLines={1}>
                      {formatPolynomial(entry.numerator)} / {formatPolynomial(entry.denominator)}
                    </Text>

                    {/* Margins */}
                    <View style={s.metricsRow}>
                      {entry.gain_margin_db != null && (
                        <View style={s.metricChip}>
                          <Text style={s.metricChipLabel}>GM</Text>
                          <Text style={s.metricChipVal}>{fmt(entry.gain_margin_db, 1)}dB</Text>
                        </View>
                      )}
                      {entry.phase_margin_deg != null && (
                        <View style={s.metricChip}>
                          <Text style={s.metricChipLabel}>PM</Text>
                          <Text style={s.metricChipVal}>{fmt(entry.phase_margin_deg, 1)}{'\u00B0'}</Text>
                        </View>
                      )}
                      <View style={s.metricChip}>
                        <Text style={s.metricChipLabel}>PTS</Text>
                        <Text style={s.metricChipVal}>{entry.num_points}</Text>
                      </View>
                    </View>

                    {/* Timestamp */}
                    <View style={s.timestampRow}>
                      <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={s.timestamp}> {formatTimestamp(entry.created_at)}</Text>
                      <Text style={s.timeAgo}> ({timeAgo(entry.created_at)})</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  subtitle: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2, marginTop: 4, marginLeft: 28 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.accentDanger, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 6 },
  clearText: { color: COLORS.accentDanger, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1 },
  // Stats
  statsBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: COLORS.bgCard, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 20, fontWeight: '700' },
  statLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, marginTop: 2 },
  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 14, marginTop: 12, letterSpacing: 1 },
  emptyHint: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 11, marginTop: 8, opacity: 0.6 },
  // Timeline
  timelineRow: { flexDirection: 'row', marginBottom: 0 },
  timelineCol: { width: 24, alignItems: 'center', paddingTop: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 4 },
  // Card
  card: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginLeft: 8, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderPill: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  orderText: { fontFamily: FONTS.mono, fontSize: 11, fontWeight: '700' },
  stableTag: { fontFamily: FONTS.mono, fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  formula: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 12, marginBottom: 8 },
  metricsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  metricChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgMain, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  metricChipLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1 },
  metricChipVal: { color: COLORS.accentSecondary, fontFamily: FONTS.mono, fontSize: 10, fontWeight: '700' },
  timestampRow: { flexDirection: 'row', alignItems: 'center' },
  timestamp: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 9 },
  timeAgo: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 9 },
});
