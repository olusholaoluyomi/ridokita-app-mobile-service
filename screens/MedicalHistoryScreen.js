import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

import { API_URL } from '../config';

export default function MedicalHistoryScreen() {
  const [appointments, setAppointments] = useState([]);
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
        
        // Open with external app
        const canOpen = await Linking.canOpenURL(uri);
        if (canOpen) {
          await Linking.openURL(uri);
        } else {
          Alert.alert('Success', 'PDF saved to device storage');
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
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medical History</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.appointment}>
            <Text>Doctor: {item.doctor_name || item.patient_name}</Text>
            <Text>Date: {item.date}</Text>
            <Text>Notes: {item.notes}</Text>
            {item.prescription && (
              <TouchableOpacity style={styles.button} onPress={() => downloadPrescription(item.id)}>
                <Text style={styles.buttonText}>Download Prescription</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  appointment: { padding: 10, borderWidth: 1, borderColor: '#ccc', marginBottom: 10, borderRadius: 5 },
  button: { backgroundColor: '#007bff', padding: 10, borderRadius: 5, marginTop: 5 },
  buttonText: { color: '#fff', textAlign: 'center' },
});