import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3000/api';

export default function AppointmentBookingScreen() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
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
        Alert.alert('Success', 'Appointment booked');
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Appointment</Text>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.doctor}
            onPress={() => {
              setSelectedDoctor(item);
              fetchAvailability(item.id, new Date().toISOString().split('T')[0]); // Today's date
            }}
          >
            <Text>{item.name} - {item.specialization}</Text>
          </TouchableOpacity>
        )}
      />
      {selectedDoctor && (
        <View>
          <Text>Available slots for {selectedDoctor.name}:</Text>
          <FlatList
            data={availability}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.slot} onPress={() => bookAppointment(item)}>
                <Text>{item.start_time} - {item.end_time}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  doctor: { padding: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 10, borderRadius: 5 },
  slot: { padding: 10, backgroundColor: '#e9ecef', marginBottom: 5, borderRadius: 5 },
});