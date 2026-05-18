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

export default function DoctorAvailabilityScreen() {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [focused, setFocused] = useState(null);
  const { user } = useAuth();

  const addAvailability = async () => {
    if (!date || !startTime || !endTime) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_URL}/appointments/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date, startTime, endTime }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Added!', 'Slot is now visible to patients.');
        setDate('');
        setStartTime('');
        setEndTime('');
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add availability');
    }
  };

  const fields = [
    { key: 'date', label: 'DATE', placeholder: 'YYYY-MM-DD', value: date, setter: setDate, keyboard: 'default' },
    { key: 'start', label: 'START TIME', placeholder: 'HH:MM', value: startTime, setter: setStartTime, keyboard: 'numbers-and-punctuation' },
    { key: 'end', label: 'END TIME', placeholder: 'HH:MM', value: endTime, setter: setEndTime, keyboard: 'numbers-and-punctuation' },
  ];

  return (
    <SafeAreaView style={ds.safe}>
      <ScrollView
        contentContainerStyle={ds.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={ds.display}>Set Availability</Text>
        <Text style={ds.subtitle}>Let patients see when you're free.</Text>

        <View style={[ds.formCard, shadow.soft]}>
          {fields.map(f => (
            <View key={f.key} style={ds.fieldGroup}>
              <Text style={ds.fieldLabel}>{f.label}</Text>
              <TextInput
                style={[ds.input, focused === f.key && ds.inputFocused]}
                placeholder={f.placeholder}
                placeholderTextColor={colors.muted}
                value={f.value}
                onChangeText={f.setter}
                keyboardType={f.keyboard}
                onFocus={() => setFocused(f.key)}
                onBlur={() => setFocused(null)}
              />
            </View>
          ))}
        </View>

        <TouchableOpacity style={[ds.addBtn, shadow.coral]} onPress={addAvailability} activeOpacity={0.85}>
          <Text style={ds.addBtnText}>Add slot</Text>
        </TouchableOpacity>

        <View style={ds.infoCard}>
          <Text style={ds.infoIcon}>✓</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={ds.infoTitle}>Instant visibility</Text>
            <Text style={ds.infoBody}>Slots appear live to patients as soon as you add them.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  display: { fontSize: 32, fontWeight: '400', color: colors.ink, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: 28 },
  formCard: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: 20, marginBottom: 24, gap: 16,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.6, paddingLeft: 4,
  },
  input: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.line,
    paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 15, color: colors.ink,
  },
  inputFocused: { borderColor: colors.brand },
  addBtn: {
    backgroundColor: colors.brand, borderRadius: radius.pill,
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  addBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  infoCard: {
    backgroundColor: colors.sageSoft, borderRadius: radius.lg,
    padding: 16, flexDirection: 'row', alignItems: 'center',
  },
  infoIcon: { fontSize: 18, color: colors.sage },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 2 },
  infoBody: { fontSize: 13, color: colors.ink2, lineHeight: 18 },
});
