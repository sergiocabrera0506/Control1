import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../src/context/AppContext';
import { formatPolynomial } from '../../src/utils/formatters';
import { COLORS, FONTS } from '../../src/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const NUM_LABELS = ['B3 (S\u00B3)', 'B2 (S\u00B2)', 'B1 (S\u00B9)', 'B0 (CONST)'];
const DEN_LABELS = ['A4 (S\u2074)', 'A3 (S\u00B3)', 'A2 (S\u00B2)', 'A1 (S\u00B9)', 'A0 (CONST)'];

export default function FunctionScreen() {
  const {
    numerator, setNumerator, denominator, setDenominator,
    config, setResult, isLoading, setIsLoading, result,
    setTimeResponse, savedTransfers, setSavedTransfers,
  } = useAppContext();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  const loadSaved = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/transfers`);
      const data = await res.json();
      setSavedTransfers(data);
    } catch { /* ignore */ }
  }, [setSavedTransfers]);

  useEffect(() => { loadSaved(); }, [loadSaved]);

  const updateCoeff = (arr: number[], setArr: (a: number[]) => void, idx: number, val: string) => {
    const next = [...arr];
    next[idx] = val === '' || val === '-' ? 0 : parseFloat(val) || 0;
    setArr(next);
  };

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const body = JSON.stringify({
        numerator, denominator,
        freq_min: config.freqMin, freq_max: config.freqMax, num_points: config.numPoints,
      });
      const headers = { 'Content-Type': 'application/json' };
      const [analyzeRes, timeRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/analyze`, { method: 'POST', headers, body }),
        fetch(`${BACKEND_URL}/api/time-response`, { method: 'POST', headers, body }),
      ]);
      const analyzeData = await analyzeRes.json();
      const timeData = await timeRes.json();
      if (analyzeData.error) Alert.alert('Error', analyzeData.error);
      else {
        setResult(analyzeData);
        if (!timeData.error) setTimeResponse(timeData);
      }
    } catch {
      Alert.alert('Error', 'Connection failed');
    }
    setIsLoading(false);
  };

  const saveTransfer = async () => {
    if (!saveName.trim()) return;
    try {
      await fetch(`${BACKEND_URL}/api/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName.trim(), numerator, denominator }),
      });
      setShowSaveModal(false);
      setSaveName('');
      loadSaved();
    } catch {
      Alert.alert('Error', 'Failed to save');
    }
  };

  const deleteSaved = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/transfers/${id}`, { method: 'DELETE' });
      loadSaved();
    } catch { /* ignore */ }
  };

  const loadTransfer = (tf: { numerator: number[]; denominator: number[] }) => {
    // Pad to expected lengths
    const num = [...Array(4 - tf.numerator.length).fill(0), ...tf.numerator];
    const den = [...Array(5 - tf.denominator.length).fill(0), ...tf.denominator];
    setNumerator(num.slice(-4));
    setDenominator(den.slice(-5));
  };

  const numDisplay = formatPolynomial(numerator);
  const denDisplay = formatPolynomial(denominator);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={s.header}>
            <View style={s.row}>
              <Ionicons name="hardware-chip" size={20} color={COLORS.accentPrimary} />
              <Text style={s.headerTitle}> ENGINEER_CORE</Text>
            </View>
          </View>

          {/* Transfer Function Card */}
          <View testID="tf-display-card" style={s.tfCard}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <View style={s.row}>
                <View style={s.activeDot} />
                <Text style={s.tfLabel}> ACTIVE SYNTHESIS</Text>
              </View>
              <TouchableOpacity testID="save-tf-btn" onPress={() => setShowSaveModal(true)} style={s.saveIcon}>
                <Ionicons name="bookmark-outline" size={20} color={COLORS.accentSecondary} />
              </TouchableOpacity>
            </View>
            <View style={s.tfDisplay}>
              <Text style={s.tfGs}>G(s) =</Text>
              <View style={s.tfFrac}>
                <Text style={s.tfText} numberOfLines={1} adjustsFontSizeToFit>{numDisplay}</Text>
                <View style={s.tfLine} />
                <Text style={s.tfText} numberOfLines={1} adjustsFontSizeToFit>{denDisplay}</Text>
              </View>
            </View>
            <View style={s.tfFooter}>
              <View>
                <Text style={s.miniLabel}>SYSTEM STABILITY</Text>
                <View style={s.bars}>
                  <View style={[s.bar, { backgroundColor: result?.is_stable !== false ? COLORS.accentPrimary : COLORS.accentDanger }]} />
                  <View style={[s.bar, { backgroundColor: result?.is_stable !== false ? COLORS.accentPrimary : COLORS.accentDanger }]} />
                  <View style={[s.bar, { backgroundColor: COLORS.textSecondary }]} />
                </View>
              </View>
              <View style={s.orderBox}>
                <Text style={s.miniLabel}>ORDER</Text>
                <Text style={s.orderVal}>{result?.order ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* Numerator */}
          <View style={s.secHeader}>
            <Text style={s.secTitle}>NUMERATOR</Text>
            <Text style={s.badge}>NUM_COEFFS</Text>
          </View>
          <View style={s.grid}>
            {NUM_LABELS.map((label, i) => (
              <View key={`n${i}`} style={s.inputBox}>
                <Text style={s.inputLabel}>{label}</Text>
                <TextInput testID={`num-coeff-${i}`} style={s.inputVal} value={String(numerator[i])}
                  onChangeText={v => updateCoeff(numerator, setNumerator, i, v)} keyboardType="numeric" placeholderTextColor={COLORS.textSecondary} />
              </View>
            ))}
          </View>

          {/* Denominator */}
          <View style={s.secHeader}>
            <Text style={s.secTitle}>DENOMINATOR</Text>
            <Text style={s.badge}>DEN_COEFFS</Text>
          </View>
          <View style={s.grid}>
            {DEN_LABELS.map((label, i) => (
              <View key={`d${i}`} style={[s.inputBox, i === 4 && s.fullWidth]}>
                <Text style={s.inputLabel}>{label}</Text>
                <TextInput testID={`den-coeff-${i}`} style={s.inputVal} value={String(denominator[i])}
                  onChangeText={v => updateCoeff(denominator, setDenominator, i, v)} keyboardType="numeric" placeholderTextColor={COLORS.textSecondary} />
              </View>
            ))}
          </View>

          {/* Info bar */}
          <View style={s.infoBar}>
            <View style={s.row}>
              <Ionicons name="flash" size={14} color={COLORS.accentPrimary} />
              <Text style={s.infoText}> SAMPLING: {config.numPoints}</Text>
            </View>
            <View style={s.row}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.accentPrimary} />
              <Text style={s.infoText}> LTI_VALID</Text>
            </View>
          </View>

          {/* Run Button */}
          <TouchableOpacity testID="run-simulation-btn" style={s.runBtn} onPress={runSimulation} disabled={isLoading} activeOpacity={0.7}>
            {isLoading ? <ActivityIndicator color={COLORS.bgMain} /> : (
              <View style={s.row}>
                <Text style={s.runText}>RUN_SIMULATION</Text>
                <Ionicons name="play-forward" size={20} color={COLORS.bgMain} />
              </View>
            )}
          </TouchableOpacity>

          {/* Saved Transfers */}
          {savedTransfers.length > 0 && (
            <>
              <View style={[s.secHeader, { marginTop: 24 }]}>
                <Text style={s.secTitle}>SAVED FUNCTIONS</Text>
                <Text style={s.badge}>{savedTransfers.length} SAVED</Text>
              </View>
              {savedTransfers.map(tf => (
                <TouchableOpacity key={tf.id} testID={`saved-tf-${tf.id}`} style={s.savedCard}
                  onPress={() => loadTransfer(tf)} activeOpacity={0.7}>
                  <View style={s.flex}>
                    <Text style={s.savedName}>{tf.name}</Text>
                    <Text style={s.savedPoly} numberOfLines={1}>
                      {formatPolynomial(tf.numerator)} / {formatPolynomial(tf.denominator)}
                    </Text>
                  </View>
                  <TouchableOpacity testID={`delete-tf-${tf.id}`} onPress={() => deleteSaved(tf.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.accentDanger} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>SAVE TRANSFER FUNCTION</Text>
            <TextInput testID="save-name-input" style={s.modalInput} value={saveName} onChangeText={setSaveName}
              placeholder="Function name..." placeholderTextColor={COLORS.textSecondary} autoFocus />
            <View style={s.modalBtns}>
              <TouchableOpacity testID="save-cancel-btn" style={s.modalBtnCancel} onPress={() => setShowSaveModal(false)}>
                <Text style={s.modalBtnCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="save-confirm-btn" style={s.modalBtnSave} onPress={saveTransfer}>
                <Text style={s.modalBtnSaveText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgMain },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', letterSpacing: 2 },
  tfCard: { backgroundColor: COLORS.bgCard, borderRadius: 4, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accentPrimary },
  tfLabel: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2 },
  saveIcon: { padding: 4 },
  tfDisplay: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  tfGs: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 18, fontWeight: '700', marginRight: 8 },
  tfFrac: { flex: 1, alignItems: 'center' },
  tfText: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 15 },
  tfLine: { height: 2, backgroundColor: COLORS.textPrimary, width: '100%', marginVertical: 6 },
  tfFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  miniLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase' },
  bars: { flexDirection: 'row', gap: 4, marginTop: 4 },
  bar: { width: 28, height: 4, borderRadius: 2 },
  orderBox: { alignItems: 'flex-end' },
  orderVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 28, fontWeight: '700' },
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  secTitle: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  badge: { color: COLORS.accentSecondary, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  inputBox: { backgroundColor: COLORS.bgCard, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 12, flexGrow: 1, flexBasis: '45%' as any },
  fullWidth: { flexBasis: '100%' as any },
  inputLabel: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' },
  inputVal: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 22, fontWeight: '700', padding: 0 },
  infoBar: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, paddingVertical: 8 },
  infoText: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1 },
  runBtn: { backgroundColor: COLORS.accentPrimary, borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  runText: { color: COLORS.bgMain, fontFamily: FONTS.mono, fontSize: 16, fontWeight: '700', letterSpacing: 2, marginRight: 8 },
  // Saved
  savedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: COLORS.accentSecondary },
  savedName: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 13, fontWeight: '700' },
  savedPoly: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 10, marginTop: 2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard: { backgroundColor: COLORS.bgCard, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { color: COLORS.accentPrimary, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 2, marginBottom: 16 },
  modalInput: { color: COLORS.textPrimary, fontFamily: FONTS.mono, fontSize: 16, borderBottomWidth: 2, borderBottomColor: COLORS.accentSecondary, paddingBottom: 8, marginBottom: 24 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  modalBtnCancelText: { color: COLORS.textSecondary, fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1 },
  modalBtnSave: { flex: 1, backgroundColor: COLORS.accentPrimary, borderRadius: 4, paddingVertical: 12, alignItems: 'center' },
  modalBtnSaveText: { color: COLORS.bgMain, fontFamily: FONTS.mono, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});
