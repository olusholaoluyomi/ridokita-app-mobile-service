import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { API_URL } from '../config';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('patient');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name, phone, specialization, licenseNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Registration successful', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RiDokita Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Picker
        selectedValue={role}
        onValueChange={setRole}
        style={styles.picker}
      >
        <Picker.Item label="Patient" value="patient" />
        <Picker.Item label="Doctor" value="doctor" />
      </Picker>
      {role === 'doctor' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Specialization"
            value={specialization}
            onChangeText={setSpecialization}
          />
          <TextInput
            style={styles.input}
            placeholder="License Number"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
          />
        </>
      )}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
  picker: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 10, color: '#007bff' },
});