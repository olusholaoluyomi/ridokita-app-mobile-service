import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';
import { colors, radius, shadow, typography } from '../theme';

// ─── helpers ────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10);

const isToday = (dateStr) => dateStr && dateStr.slice(0, 10) === todayStr();

const formatTime = (timeStr) => {
  if (!timeStr) return '--';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 || 12;
  return `${display}:${m}\n${ampm}`;
};

const getInitials = (name) => {
  if (!name) return 'DR';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

// ─── component ──────────────────────────────────────────────────────────────

export default function DoctorDashboard({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [pendingAppointments, setPendingAppointments] = useState(0);
  const { user, logout } = useAuth();

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
      setAppointments(data);
      setTotalAppointments(data.length);
      const pending = data.filter((app) => app.status === 'scheduled').length;
      setPendingAppointments(pending);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch appointments');
    }
  };

  const startCall = (appointmentId) => {
    updateAppointmentStatus(appointmentId, 'in_progress');
    navigation.navigate('VideoCall', { appointmentId });
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  // ── derived stats ──
  const todayAppts = appointments.filter((a) => isToday(a.date));
  const queueCount = todayAppts.filter(
    (a) => a.status === 'confirmed' || a.status === 'scheduled'
  ).length;
  const pendingCount = appointments.filter(
    (a) => a.status === 'scheduled'
  ).length;
  const completedCount = todayAppts.filter(
    (a) => a.status === 'completed'
  ).length;

  const doctorName = user?.name || 'Doctor';
  const initials = getInitials(user?.name);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>Today</Text>
            <Text style={styles.greeting} numberOfLines={2}>
              Good morning,{'\n'}Dr. {doctorName}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <StatCard label="Today's queue" value={queueCount} />
          <StatCard label="Pending" value={pendingCount} />
          <StatCard label="Completed" value={completedCount} />
        </View>

        {/* ── Today's patients ── */}
        <Text style={styles.sectionTitle}>Today's patients</Text>

        {todayAppts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No appointments for today.</Text>
          </View>
        ) : (
          todayAppts.map((item) => (
            <AppointmentCard
              key={item.id.toString()}
              item={item}
              onStartCall={() => startCall(item.id)}
              onEditNotes={() =>
                navigation.navigate('AppointmentDetails', { appointment: item })
              }
              onJoinCall={() =>
                navigation.navigate('VideoCall', { appointmentId: item.id })
              }
            />
          ))
        )}

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AppointmentCard({ item, onStartCall, onEditNotes, onJoinCall }) {
  const isConfirmed = item.status === 'confirmed';
  const isInProgress = item.status === 'in_progress';

  return (
    <View style={styles.apptCard}>
      {/* Time box */}
      <View style={styles.timeBox}>
        <Text style={styles.timeText}>{formatTime(item.time)}</Text>
      </View>

      {/* Info */}
      <View style={styles.apptInfo}>
        <Text style={styles.patientName} numberOfLines={1}>
          {item.patient_name || 'Patient'}
        </Text>
        {item.reason ? (
          <Text style={styles.apptReason} numberOfLines={1}>
            {item.reason}
          </Text>
        ) : null}
        {item.duration ? (
          <Text style={styles.apptDuration}>{item.duration} min</Text>
        ) : null}
        <StatusPill status={item.status} />
      </View>

      {/* Action */}
      <View style={styles.apptActions}>
        {isConfirmed && (
          <TouchableOpacity style={styles.startBtn} onPress={onStartCall}>
            <Text style={styles.startBtnText}>Start call</Text>
          </TouchableOpacity>
        )}
        {isInProgress && (
          <TouchableOpacity style={styles.startBtn} onPress={onJoinCall}>
            <Text style={styles.startBtnText}>Join call</Text>
          </TouchableOpacity>
        )}
        {!isConfirmed && !isInProgress && (
          <View style={styles.readyBtn}>
            <Text style={styles.readyBtnText}>Ready</Text>
          </View>
        )}
        <TouchableOpacity style={styles.notesLink} onPress={onEditNotes}>
          <Text style={styles.notesLinkText}>Notes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatusPill({ status }) {
  const pillStyle =
    status === 'confirmed'
      ? styles.pillConfirmed
      : status === 'completed'
      ? styles.pillCompleted
      : status === 'in_progress'
      ? styles.pillInProgress
      : styles.pillScheduled;

  const textStyle =
    status === 'confirmed'
      ? styles.pillTextConfirmed
      : status === 'completed'
      ? styles.pillTextCompleted
      : status === 'in_progress'
      ? styles.pillTextInProgress
      : styles.pillTextScheduled;

  const label =
    status === 'confirmed'
      ? 'Confirmed'
      : status === 'completed'
      ? 'Completed'
      : status === 'in_progress'
      ? 'In progress'
      : 'Scheduled';

  return (
    <View style={[styles.pill, pillStyle]}>
      <Text style={[styles.pillText, textStyle]}>{label}</Text>
    </View>
  );
}

// ─── styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.muted,
    marginBottom: 4,
  },
  greeting: {
    ...typography.h1,
    color: colors.ink,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    ...shadow.soft,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 30,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.xs,
    color: colors.muted,
    textTransform: 'none',
    letterSpacing: 0,
  },

  // Section
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: 14,
  },

  // Appointment card
  apptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...shadow.soft,
  },
  timeBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandDeep,
    textAlign: 'center',
    lineHeight: 14,
  },
  apptInfo: {
    flex: 1,
    gap: 2,
  },
  patientName: {
    ...typography.h3,
    color: colors.ink,
  },
  apptReason: {
    ...typography.sm,
    color: colors.ink2,
  },
  apptDuration: {
    ...typography.xs,
    color: colors.muted,
    letterSpacing: 0,
  },
  apptActions: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 6,
    marginLeft: 8,
  },
  startBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  readyBtn: {
    backgroundColor: colors.surface2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  readyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  notesLink: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  notesLinkText: {
    ...typography.sm,
    color: colors.accent,
    fontWeight: '600',
  },

  // Status pills
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pillConfirmed: { backgroundColor: colors.brandSoft },
  pillTextConfirmed: { color: colors.brandDeep },
  pillScheduled: { backgroundColor: colors.surface2 },
  pillTextScheduled: { color: colors.muted },
  pillCompleted: { backgroundColor: colors.sageSoft },
  pillTextCompleted: { color: colors.sage },
  pillInProgress: { backgroundColor: colors.accentSoft },
  pillTextInProgress: { color: colors.accent },

  // Empty state
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...shadow.soft,
    marginBottom: 12,
  },
  emptyText: {
    ...typography.body,
    color: colors.muted,
  },

  // Logout
  logoutBtn: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    ...typography.sm,
    color: colors.muted,
    fontWeight: '600',
  },
});
