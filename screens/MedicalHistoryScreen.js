import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { API_URL } from '../config';
import { colors, radius, shadow } from '../theme';

const STATUS_COLORS = {
  completed: { bg: '#DEEDE5', text: '#6FAE94' },
  cancelled: { bg: '#FADEDA', text: '#D85F4C' },
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function DateBox({ dateStr }) {
  const d = dateStr ? new Date(dateStr) : null;
  const month = d ? MONTHS[d.getMonth()] : '--';
  const day = d ? d.getDate() : '--';
  return (
    <View style={ds.dateBox}>
      <Text style={ds.dateMonth}>{month}</Text>
      <Text style={ds.dateDay}>{day}</Text>
    </View>
  );
}

export default function MedicalHistoryScreen() {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAppointments(data.filter(app => app.status === 'completed'));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch history');
    }
  };

  const downloadPrescription = async (appointmentId) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_URL}/appointments/${appointmentId}/prescription`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const uri = FileSystem.documentDirectory + `prescription_${appointmentId}.pdf`;
        const base64 = await blobToBase64(blob);
        await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
        const canOpen = await Linking.canOpenURL(uri);
        if (canOpen) {
          await Linking.openURL(uri);
        } else {
          Alert.alert('Saved', 'PDF saved to device storage');
        }
      } else {
        Alert.alert('Error', 'Failed to download prescription');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download prescription');
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { resolve(reader.result.split(',')[1]); };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const tabs = ['all', 'prescriptions'];
  const displayed = activeTab === 'prescriptions'
    ? appointments.filter(a => a.prescription)
    : appointments;

  return (
    <SafeAreaView style={ds.safe}>
      <FlatList
        data={displayed}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={ds.scroll}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={ds.display}>Records</Text>
            <Text style={ds.subtitle}>Your complete health history</Text>

            <View style={ds.segTrack}>
              {[['all', 'All'], ['prescriptions', 'Prescriptions']].map(([k, lbl]) => (
                <TouchableOpacity
                  key={k}
                  style={[ds.segTab, activeTab === k && ds.segTabActive]}
                  onPress={() => setActiveTab(k)}
                >
                  <Text style={[ds.segLabel, activeTab === k && ds.segLabelActive]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => {
          const sc = STATUS_COLORS[item.status] || STATUS_COLORS.completed;
          return (
            <View style={[ds.card, shadow.soft]}>
              <View style={ds.cardTop}>
                <DateBox dateStr={item.date} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={ds.doctorName}>{item.doctor_name || item.patient_name}</Text>
                  <Text style={ds.specialty}>{item.specialty || 'Consultation'}</Text>
                </View>
                <View style={[ds.statusPill, { backgroundColor: sc.bg }]}>
                  <Text style={[ds.statusText, { color: sc.text }]}>Completed</Text>
                </View>
              </View>

              {item.notes ? (
                <View style={ds.notesSection}>
                  <Text style={ds.notesLabel}>Notes</Text>
                  <Text style={ds.notesText} numberOfLines={2}>{item.notes}</Text>
                </View>
              ) : null}

              {item.prescription ? (
                <TouchableOpacity
                  style={ds.rxBtn}
                  onPress={() => downloadPrescription(item.id)}
                  activeOpacity={0.8}
                >
                  <Text style={ds.rxBtnText}>↓ Download Prescription</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={[ds.emptyCard, shadow.soft]}>
            <Text style={ds.emptyTitle}>No records yet</Text>
            <Text style={ds.emptyMuted}>Completed visits will appear here.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const ds = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  display: { fontSize: 32, fontWeight: '400', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: 20 },
  segTrack: {
    flexDirection: 'row', backgroundColor: colors.surface2,
    borderRadius: 14, padding: 4, marginBottom: 20,
  },
  segTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  segTabActive: { backgroundColor: colors.surface, ...shadow.soft },
  segLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  segLabelActive: { color: colors.ink },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: 16, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  dateBox: {
    width: 44, height: 52, borderRadius: 12, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  dateMonth: { fontSize: 9, fontWeight: '700', color: colors.brandDeep, textTransform: 'uppercase' },
  dateDay: { fontSize: 20, fontWeight: '700', color: colors.brandDeep },
  doctorName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  specialty: { fontSize: 12, color: colors.muted, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  notesSection: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.line,
  },
  notesLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  notesText: { fontSize: 14, color: colors.ink2, lineHeight: 20 },
  rxBtn: {
    marginTop: 12, backgroundColor: colors.brandSoft, borderRadius: radius.pill,
    paddingVertical: 9, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  rxBtnText: { fontSize: 13, fontWeight: '600', color: colors.brandDeep },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: 40, alignItems: 'center', marginTop: 20,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  emptyMuted: { fontSize: 14, color: colors.muted },
});
