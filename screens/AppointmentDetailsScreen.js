import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';
import { colors, radius, shadow } from '../theme';

export default function AppointmentDetailsScreen({ route, navigation }) {
  const { appointment } = route.params;
  const [notes, setNotes] = useState(appointment.notes || '');
  const [prescription, setPrescription] = useState(appointment.prescription || '');
  const [notesFocused, setNotesFocused] = useState(false);
  const [rxFocused, setRxFocused] = useState(false);
  const { user } = useAuth();

  const saveDetails = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_URL}/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes, prescription }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Saved', 'Details updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save details');
    }
  };

  const statusColors = {
    confirmed: { bg: colors.brandSoft, text: colors.brandDeep },
    scheduled: { bg: colors.accentSoft, text: colors.accent },
    completed: { bg: colors.sageSoft, text: colors.sage },
    in_progress: { bg: colors.brandSoft, text: colors.brandDeep },
  };
  const sc = statusColors[appointment.status] || statusColors.scheduled;

  return (
    <SafeAreaView style={ds.safe}>
      <ScrollView
        contentContainerStyle={ds.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity style={ds.backBtn} onPress={() => navigation.goBack()}>
          <Text style={ds.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header card */}
        <View style={[ds.headerCard, shadow.soft]}>
          <View style={ds.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={ds.patientName}>{appointment.patient_name || appointment.doctor_name}</Text>
              <Text style={ds.dateTime}>{appointment.date} · {appointment.time}</Text>
            </View>
            <View style={[ds.statusPill, { backgroundColor: sc.bg }]}>
              <Text style={[ds.statusText, { color: sc.text }]}>
                {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
              </Text>
            </View>
          </View>
          {appointment.type ? (
            <Text style={ds.typeText}>{appointment.type} · {appointment.duration} min</Text>
          ) : null}
        </View>

        {/* Notes section */}
        <Text style={ds.sectionLabel}>SESSION NOTES</Text>
        <TextInput
          style={[ds.textarea, notesFocused && ds.textareaFocused]}
          multiline
          numberOfLines={5}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add session notes here…"
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
          onFocus={() => setNotesFocused(true)}
          onBlur={() => setNotesFocused(false)}
        />

        {/* Prescription section */}
        <Text style={[ds.sectionLabel, { marginTop: 20 }]}>PRESCRIPTION</Text>
        <TextInput
          style={[ds.textarea, { minHeight: 140 }, rxFocused && ds.textareaFocused]}
          multiline
          numberOfLines={6}
          value={prescription}
          onChangeText={setPrescription}
          placeholder="Enter prescription details, dosage, duration…"
          placeholderTextColor={colors.muted}
          textAlignVertical="top"
          onFocus={() => setRxFocused(true)}
          onBlur={() => setRxFocused(false)}
        />

        {/* Save */}
        <TouchableOpacity style={[ds.saveBtn, shadow.coral]} onPress={saveDetails} activeOpacity={0.85}>
          <Text style={ds.saveBtnText}>Save details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 15, fontWeight: '600', color: colors.brand },
  headerCard: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: 18, marginBottom: 24,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start' },
  patientName: { fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  dateTime: { fontSize: 14, color: colors.muted },
  statusPill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill, marginLeft: 12,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  typeText: { fontSize: 13, color: colors.ink2, marginTop: 10 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
  },
  textarea: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.line,
    padding: 14, fontSize: 15, color: colors.ink,
    minHeight: 120,
  },
  textareaFocused: {
    borderColor: colors.brand,
    shadowColor: colors.brandSoft,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  saveBtn: {
    backgroundColor: colors.brand, borderRadius: radius.pill,
    paddingVertical: 16, alignItems: 'center', marginTop: 28,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
