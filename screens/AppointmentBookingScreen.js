import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';
import { colors, radius, shadow } from '../theme';

function Avatar({ name = '', size = 50 }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: colors.white, fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export default function AppointmentBookingScreen() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_URL}/users/doctors`);
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch doctors');
    }
  };

  const fetchAvailability = async (doctorId, date) => {
    try {
      const response = await fetch(`${API_URL}/appointments/availability/${doctorId}?date=${date}`);
      const data = await response.json();
      setAvailability(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch availability');
    }
  };

  const bookAppointment = async (slot) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          date: slot.date,
          time: slot.start_time,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Booked!', 'Your appointment is confirmed.');
        setSelectedDoctor(null);
        setSelectedSlot(null);
        setAvailability([]);
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment');
    }
  };

  const filtered = doctors.filter(d =>
    !searchQ || (d.name + ' ' + d.specialization).toLowerCase().includes(searchQ.toLowerCase())
  );

  if (selectedDoctor) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={s.backBtn} onPress={() => { setSelectedDoctor(null); setAvailability([]); setSelectedSlot(null); }}>
            <Text style={s.backBtnText}>← Back to doctors</Text>
          </TouchableOpacity>

          <View style={[s.doctorCard, shadow.soft]}>
            <View style={s.doctorRow}>
              <Avatar name={selectedDoctor.name} size={56} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.doctorName}>{selectedDoctor.name}</Text>
                <Text style={s.doctorSpec}>{selectedDoctor.specialization}</Text>
              </View>
            </View>
          </View>

          <Text style={s.sectionTitle}>Available slots</Text>
          {availability.length === 0 ? (
            <View style={[s.emptyCard, shadow.soft]}>
              <Text style={s.emptyText}>No slots available today.</Text>
              <Text style={s.emptyMuted}>Try another date.</Text>
            </View>
          ) : (
            <View style={s.slotsWrap}>
              {availability.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  style={[s.slotPill, selectedSlot?.id === slot.id && s.slotPillActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[s.slotText, selectedSlot?.id === slot.id && s.slotTextActive]}>
                    {slot.start_time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedSlot && (
            <TouchableOpacity style={[s.bookBtn, shadow.coral]} onPress={() => bookAppointment(selectedSlot)}>
              <Text style={s.bookBtnText}>Confirm Booking · {selectedSlot.start_time}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={s.display}>Find a doctor</Text>
            <Text style={s.subtitle}>{doctors.length} clinicians available</Text>
            <View style={s.searchBar}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Search name or specialty…"
                placeholderTextColor={colors.muted}
                value={searchQ}
                onChangeText={setSearchQ}
              />
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.doctorCard, shadow.soft]}
            onPress={() => {
              setSelectedDoctor(item);
              fetchAvailability(item.id, new Date().toISOString().split('T')[0]);
            }}
            activeOpacity={0.85}
          >
            <View style={s.doctorRow}>
              <Avatar name={item.name} size={52} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.doctorName}>{item.name}</Text>
                  <Text style={s.ratingText}>⭐ {item.rating || '4.8'}</Text>
                </View>
                <Text style={s.doctorSpec}>{item.specialization}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <View style={s.pill}>
                    <Text style={s.pillText}>${item.price || '25'} visit</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.bookSmBtn, shadow.coral]}
                    onPress={() => {
                      setSelectedDoctor(item);
                      fetchAvailability(item.id, new Date().toISOString().split('T')[0]);
                    }}
                  >
                    <Text style={s.bookSmText}>Book</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={[s.emptyCard, shadow.soft]}>
            <Text style={s.emptyText}>No doctors found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  display: { fontSize: 32, fontWeight: '400', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: 18 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: 14, marginBottom: 20,
    borderWidth: 1, borderColor: colors.line,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: colors.ink },
  doctorCard: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: 16, marginBottom: 12,
  },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  doctorName: { fontSize: 17, fontWeight: '600', color: colors.ink },
  doctorSpec: { fontSize: 13, color: colors.muted, marginTop: 2 },
  ratingText: { fontSize: 13, fontWeight: '600', color: colors.sun },
  pill: {
    backgroundColor: colors.surface2, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.ink2 },
  bookSmBtn: {
    backgroundColor: colors.brand, paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  bookSmText: { fontSize: 13, fontWeight: '600', color: colors.white },
  backBtn: { marginBottom: 20 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: colors.brand },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 12, marginTop: 4 },
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  slotPill: {
    backgroundColor: colors.surface, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line2,
  },
  slotPillActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  slotText: { fontSize: 14, fontWeight: '600', color: colors.ink2 },
  slotTextActive: { color: colors.brandDeep },
  bookBtn: {
    backgroundColor: colors.brand, borderRadius: radius.pill,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  bookBtnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: 32, alignItems: 'center',
  },
  emptyText: { fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 4 },
  emptyMuted: { fontSize: 14, color: colors.muted },
});
