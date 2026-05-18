import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { API_URL } from '../config';
import { colors, shadow, radius, typography } from '../theme';

// ─── Inline SVG-style icon components (no external deps) ────────────────────

function SearchIcon({ size = 18, color = colors.ink2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size * 0.3,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.3,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
          transform: [{ rotate: '45deg' }, { translateX: 1 }],
        }}
      />
    </View>
  );
}

function BellIcon({ size = 18, color = colors.ink2 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.6,
          height: size * 0.55,
          borderTopLeftRadius: size * 0.3,
          borderTopRightRadius: size * 0.3,
          borderWidth: 2,
          borderColor: color,
          borderBottomWidth: 0,
          marginTop: 1,
        }}
      />
      <View
        style={{
          width: size * 0.7,
          height: 2,
          backgroundColor: color,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: size * 0.11,
          borderWidth: 2,
          borderColor: color,
          marginTop: 1,
        }}
      />
    </View>
  );
}

function VideoIcon({ size = 20, color = colors.accent }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.55,
          height: size * 0.45,
          borderRadius: 3,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 0,
          width: 0,
          height: 0,
          borderTopWidth: size * 0.2,
          borderBottomWidth: size * 0.2,
          borderLeftWidth: size * 0.25,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
        }}
      />
    </View>
  );
}

function MessageIcon({ size = 18, color = colors.white }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size * 0.8,
          height: size * 0.65,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: size * 0.15,
          width: 0,
          height: 0,
          borderTopWidth: size * 0.22,
          borderRightWidth: size * 0.22,
          borderTopColor: color,
          borderRightColor: 'transparent',
        }}
      />
    </View>
  );
}

function ActivityIcon({ size = 20, color = colors.sun }) {
  const pts = [0, 0.3, 0.45, 0.7, 1];
  const ys = [0.5, 0.5, 0.15, 0.85, 0.5];
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {pts.slice(0, -1).map((x, i) => {
        const x1 = x * size;
        const y1 = ys[i] * size;
        const x2 = pts[i + 1] * size;
        const y2 = ys[i + 1] * size;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: len,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 50%',
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDayNumber(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).getDate().toString().padStart(2, '0');
}

function getMonthAbbr(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

// ─── Sparkline bars (decorative) ─────────────────────────────────────────────

function Sparkline({ color = colors.brand, heights = [0.5, 0.7, 0.4, 0.9, 0.6, 0.8, 0.55] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 20, gap: 2 }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: Math.max(4, Math.round(h * 20)),
            backgroundColor: color,
            borderRadius: 2,
            opacity: 0.7,
          }}
        />
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PatientDashboard({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchAppointments();
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please enable notifications for appointment reminders');
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAppointments(data);
      setTotalAppointments(data.length);
      const upcoming = data.filter(
        (app) => app.status === 'scheduled' || app.status === 'confirmed',
      ).length;
      setUpcomingAppointments(upcoming);
      scheduleAppointmentReminders(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch appointments');
    }
  };

  const scheduleAppointmentReminders = async (apps) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = new Date();
    apps.forEach(async (app) => {
      if (app.status === 'scheduled' || app.status === 'confirmed') {
        const appointmentTime = new Date(`${app.date}T${app.time}`);
        const reminderTime = new Date(appointmentTime.getTime() - 15 * 60 * 1000);
        if (reminderTime > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Appointment Reminder',
              body: `You have an appointment with ${app.doctor_name} at ${app.time}`,
              sound: 'default',
            },
            trigger: { date: reminderTime },
          });
        }
      }
    });
  };

  const joinCall = (appointmentId) => {
    navigation.navigate('VideoCall', { appointmentId });
  };

  // Derived data
  const upcomingList = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'scheduled',
  );
  const nextAppointment = upcomingList[0] ?? null;

  const initials = getInitials(user?.name);
  const greeting = getGreeting();

  // ─── HEADER ────────────────────────────────────────────────────────────────

  const Header = () => (
    <View style={styles.header}>
      {/* Left: avatar + greeting */}
      <View style={styles.headerLeft}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.greetingSmall}>{greeting},</Text>
          <Text style={styles.greetingName} numberOfLines={1}>
            {user?.name ?? 'there'} 👋
          </Text>
        </View>
      </View>

      {/* Right: search + bell */}
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconBtn}>
          <SearchIcon size={18} color={colors.ink2} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]}>
          <BellIcon size={18} color={colors.ink2} />
          {/* Notification dot */}
          <View style={styles.notifDot} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── HERO CARD ─────────────────────────────────────────────────────────────

  const HeroCard = () => {
    if (!nextAppointment) return null;

    const doctorInitials = getInitials(nextAppointment.doctor_name ?? '');
    const dateLabel = formatShortDate(nextAppointment.date);
    const timeLabel = nextAppointment.time ?? '';
    const specialty = nextAppointment.specialty ?? nextAppointment.doctor_specialty ?? 'General Practice';
    const duration = nextAppointment.duration ?? '30 min';

    return (
      <TouchableOpacity
        style={styles.heroCard}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: nextAppointment.id })}
      >
        {/* Top row */}
        <View style={styles.heroTopRow}>
          <View style={styles.nextVisitBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.nextVisitLabel}>NEXT VISIT</Text>
          </View>
          <Text style={styles.heroDayTime}>
            {dateLabel}{'  '}·{'  '}{timeLabel}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.heroDivider} />

        {/* Doctor row */}
        <View style={styles.heroDoctorRow}>
          <View style={styles.doctorAvatarCircle}>
            <Text style={styles.doctorAvatarInitials}>{doctorInitials}</Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.doctorName}>{nextAppointment.doctor_name ?? 'Your Doctor'}</Text>
            <Text style={styles.doctorSpecialty}>{specialty}</Text>
          </View>
          <View style={styles.durationPill}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.heroBottomRow}>
          <TouchableOpacity
            style={styles.joinCallBtn}
            onPress={() => joinCall(nextAppointment.id)}
            activeOpacity={0.82}
          >
            <Text style={styles.joinCallText}>Join call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.msgBtn}>
            <MessageIcon size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── QUICK ACTIONS ─────────────────────────────────────────────────────────

  const quickActions = [
    { label: 'Symptom check', icon: '⚡', bg: colors.brandSoft },
    { label: 'Book visit', icon: null, bg: colors.accentSoft, useVideo: true },
    { label: 'Refill meds', icon: '💊', bg: colors.sageSoft },
    { label: 'Vitals', icon: '📊', bg: colors.sunSoft },
  ];

  const QuickActions = () => (
    <View style={styles.section}>
      <View style={styles.quickGrid}>
        {quickActions.map((action, idx) => (
          <TouchableOpacity key={idx} style={styles.quickCard} activeOpacity={0.8}>
            <View style={[styles.quickIconBox, { backgroundColor: action.bg }]}>
              {action.useVideo ? (
                <VideoIcon size={20} color={colors.accent} />
              ) : (
                <Text style={{ fontSize: 20 }}>{action.icon}</Text>
              )}
            </View>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ─── VITALS SNAPSHOT ───────────────────────────────────────────────────────

  const vitals = [
    {
      title: 'Heart rate',
      value: '72',
      unit: 'bpm',
      color: colors.brand,
      spark: [0.5, 0.7, 0.6, 0.8, 0.7, 0.9, 0.72],
    },
    {
      title: 'Blood pressure',
      value: '118/76',
      unit: 'mmHg',
      color: colors.accent,
      spark: [0.6, 0.55, 0.62, 0.58, 0.6, 0.57, 0.61],
    },
    {
      title: 'Steps',
      value: '8,420',
      unit: 'today',
      color: colors.sage,
      spark: [0.3, 0.5, 0.6, 0.7, 0.8, 0.85, 0.88],
    },
    {
      title: 'Sleep',
      value: '7h 18m',
      unit: '',
      color: colors.sun,
      spark: [0.8, 0.9, 0.85, 0.75, 0.8, 0.88, 0.78],
    },
  ];

  const VitalsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's vitals</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.vitalsGrid}>
        {vitals.map((v, idx) => (
          <View key={idx} style={styles.vitalChip}>
            <Text style={styles.vitalTitle}>{v.title}</Text>
            <View style={styles.vitalValueRow}>
              <Text style={[styles.vitalValue, { color: v.color }]}>{v.value}</Text>
              {v.unit ? <Text style={styles.vitalUnit}>{v.unit}</Text> : null}
            </View>
            <Sparkline color={v.color} heights={v.spark} />
          </View>
        ))}
      </View>
    </View>
  );

  // ─── APPOINTMENTS LIST ─────────────────────────────────────────────────────

  const AppointmentsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Your upcoming visits</Text>
          <Text style={styles.sectionSubtitle}>
            {upcomingAppointments} appointment{upcomingAppointments !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {upcomingList.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 28 }}>🗓</Text>
          <Text style={styles.emptyText}>No upcoming appointments</Text>
          <Text style={styles.emptySubtext}>Book a visit to get started</Text>
        </View>
      ) : (
        upcomingList.map((item) => (
          <TouchableOpacity
            key={item.id.toString()}
            style={styles.apptCard}
            activeOpacity={0.82}
            onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item.id })}
          >
            {/* Date box */}
            <View style={styles.apptDateBox}>
              <Text style={styles.apptDay}>{getDayNumber(item.date)}</Text>
              <Text style={styles.apptMonth}>{getMonthAbbr(item.date)}</Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.apptDoctor} numberOfLines={1}>
                {item.doctor_name ?? 'Doctor'}
              </Text>
              <Text style={styles.apptSpecialty} numberOfLines={1}>
                {item.specialty ?? item.doctor_specialty ?? 'General Practice'}
              </Text>
              <Text style={styles.apptTime}>{item.time ?? ''}</Text>
            </View>

            {/* Status pill */}
            <View
              style={[
                styles.statusPill,
                item.status === 'confirmed'
                  ? styles.statusConfirmed
                  : styles.statusScheduled,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status === 'confirmed'
                    ? styles.statusTextConfirmed
                    : styles.statusTextScheduled,
                ]}
              >
                {item.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Fixed header outside scroll */}
      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeroCard />
        <QuickActions />
        <VitalsSection />
        <AppointmentsSection />

        {/* Subtle logout */}
        <TouchableOpacity style={styles.logoutRow} onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Root
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Header ──
  header: {
    paddingTop: 58,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.h3,
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  greetingSmall: {
    ...typography.xs,
    color: colors.muted,
  },
  greetingName: {
    ...typography.h3,
    color: colors.ink,
    fontSize: 16,
    maxWidth: 160,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  // ── ScrollView ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  // ── Hero Card ──
  heroCard: {
    backgroundColor: '#2A1B22',
    borderRadius: 26,
    padding: 18,
    marginBottom: 22,
    ...shadow.pop,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  nextVisitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  nextVisitLabel: {
    ...typography.eyebrow,
    color: '#4ADE80',
    fontSize: 10,
  },
  heroDayTime: {
    ...typography.xs,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  heroDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  doctorAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorAvatarInitials: {
    ...typography.h3,
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  doctorName: {
    ...typography.h3,
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  doctorSpecialty: {
    ...typography.xs,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
  },
  durationPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationText: {
    ...typography.xs,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  joinCallBtn: {
    flex: 1,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.coral,
  },
  joinCallText: {
    ...typography.sm,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  msgBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Section wrapper ──
  section: {
    marginBottom: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    ...typography.xs,
    color: colors.muted,
    marginTop: 2,
  },
  seeAll: {
    ...typography.sm,
    color: colors.brand,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Quick Actions ──
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    alignItems: 'flex-start',
    ...shadow.soft,
  },
  quickIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickLabel: {
    ...typography.xs,
    color: colors.ink,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 14,
  },

  // ── Vitals ──
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalChip: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    ...shadow.soft,
  },
  vitalTitle: {
    ...typography.xs,
    color: colors.muted,
    marginBottom: 6,
    fontSize: 11,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 10,
  },
  vitalValue: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  vitalUnit: {
    ...typography.xs,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 20,
  },

  // ── Appointments ──
  apptCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...shadow.soft,
  },
  apptDateBox: {
    width: 46,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptDay: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.brandDeep,
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  apptMonth: {
    ...typography.eyebrow,
    color: colors.brand,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  apptDoctor: {
    ...typography.h3,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  apptSpecialty: {
    ...typography.xs,
    color: colors.ink2,
    fontSize: 11,
    marginBottom: 3,
  },
  apptTime: {
    ...typography.xs,
    color: colors.muted,
    fontSize: 11,
  },
  statusPill: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusConfirmed: {
    backgroundColor: colors.brandSoft,
  },
  statusScheduled: {
    backgroundColor: colors.accentSoft,
  },
  statusText: {
    ...typography.eyebrow,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  statusTextConfirmed: {
    color: colors.brandDeep,
  },
  statusTextScheduled: {
    color: colors.accent,
  },

  // ── Empty state ──
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 28,
    alignItems: 'center',
    ...shadow.soft,
  },
  emptyText: {
    ...typography.h3,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtext: {
    ...typography.sm,
    color: colors.muted,
  },

  // ── Logout ──
  logoutRow: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  logoutText: {
    ...typography.sm,
    color: colors.muted,
    fontWeight: '500',
  },
});
