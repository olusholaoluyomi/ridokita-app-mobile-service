import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3000/api';

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
      const pending = data.filter(app => app.status === 'scheduled').length;
      setPendingAppointments(pending);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch appointments');
    }
  };

  const startCall = (appointmentId) => {
    // Update status to in_progress
    updateAppointmentStatus(appointmentId, 'in_progress');
    navigation.navigate('VideoCall', { appointmentId });
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      await fetch(`${API_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dr. {user?.name}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>Total Appointments: {totalAppointments}</Text>
        <Text style={styles.stat}>Pending: {pendingAppointments}</Text>
      </View>
      <Text style={styles.subtitle}>Your Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.appointment}>
            <Text>Patient: {item.patient_name}</Text>
            <Text>Date: {item.date} Time: {item.time}</Text>
            <Text>Status: {item.status}</Text>
            {item.status === 'confirmed' && (
              <TouchableOpacity style={styles.button} onPress={() => startCall(item.id)}>
                <Text style={styles.buttonText}>Start Call</Text>
              </TouchableOpacity>
            )}
            {item.status === 'in_progress' && (
              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('VideoCall', { appointmentId: item.id })}>
                <Text style={styles.buttonText}>Join Call</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}>
              <Text style={styles.buttonText}>Edit Notes</Text>
            </TouchableOpacity>
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
  editButton: { backgroundColor: '#28a745', padding: 10, borderRadius: 5, marginTop: 5 },
  buttonText: { color: '#fff', textAlign: 'center' },
  logoutButton: { backgroundColor: '#dc3545', padding: 15, borderRadius: 5, marginTop: 20 },
});