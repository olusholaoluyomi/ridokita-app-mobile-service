import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';

import { API_URL } from '../config';

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
      const upcoming = data.filter(app => app.status === 'scheduled' || app.status === 'confirmed').length;
      setUpcomingAppointments(upcoming);

      // Schedule notifications for upcoming appointments
      scheduleAppointmentReminders(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch appointments');
    }
  };

  const scheduleAppointmentReminders = async (apps) => {
    // Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    apps.forEach(async (app) => {
      if (app.status === 'scheduled' || app.status === 'confirmed') {
        const appointmentTime = new Date(`${app.date}T${app.time}`);
        const reminderTime = new Date(appointmentTime.getTime() - 15 * 60 * 1000); // 15 minutes before

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.name}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>Total Appointments: {totalAppointments}</Text>
        <Text style={styles.stat}>Upcoming: {upcomingAppointments}</Text>
      </View>
      <Text style={styles.subtitle}>Your Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.appointment}>
            <Text>Doctor: {item.doctor_name}</Text>
            <Text>Date: {item.date} Time: {item.time}</Text>
            <Text>Status: {item.status}</Text>
            {item.status === 'in_progress' && (
              <TouchableOpacity style={styles.button} onPress={() => joinCall(item.id)}>
                <Text style={styles.buttonText}>Join Call</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  stats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  stat: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { fontSize: 18, marginBottom: 10 },
  appointment: { padding: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 10, borderRadius: 5 },
  button: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, marginTop: 5 },
  buttonText: { color: '#fff', textAlign: 'center' },
  logoutButton: { backgroundColor: '#dc3545', padding: 15, borderRadius: 5, marginTop: 20 },
});