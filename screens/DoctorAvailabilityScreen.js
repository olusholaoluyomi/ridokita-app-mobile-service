import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';

import { API_URL } from '../config';

export default function DoctorAvailabilityScreen({ navigation }) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const { user } = useAuth();

  const addAvailability = async () => {
    if (!date || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill all fields');
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
        Alert.alert('Success', 'Availability added');
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Availability</Text>
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <TextInput
        style={styles.input}
        placeholder="Start Time (HH:MM)"
        value={startTime}
        onChangeText={setStartTime}
      />
      <TextInput
        style={styles.input}
        placeholder="End Time (HH:MM)"
        value={endTime}
        onChangeText={setEndTime}
      />
      <TouchableOpacity style={styles.button} onPress={addAvailability}>
        <Text style={styles.buttonText}>Add Slot</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16 },
});