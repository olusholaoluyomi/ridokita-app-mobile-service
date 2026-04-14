import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3000/api';

export default function AppointmentDetailsScreen({ route, navigation }) {
  const { appointment } = route.params;
  const [notes, setNotes] = useState(appointment.notes || '');
  const [prescription, setPrescription] = useState(appointment.prescription || '');
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
        Alert.alert('Success', 'Details saved');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save details');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Appointment Details</Text>
      <Text>Patient: {appointment.patient_name}</Text>
      <Text>Date: {appointment.date} Time: {appointment.time}</Text>
      <Text style={styles.label}>Session Notes:</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
        placeholder="Enter session notes"
      />
      <Text style={styles.label}>Prescription:</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={6}
        value={prescription}
        onChangeText={setPrescription}
        placeholder="Enter prescription details"
      />
      <TouchableOpacity style={styles.button} onPress={saveDetails}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  textArea: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5, textAlignVertical: 'top' },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16 },
});