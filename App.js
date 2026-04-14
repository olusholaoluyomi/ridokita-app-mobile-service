import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import * as Notifications from 'expo-notifications';

// Configure notifications
import { View, Text } from 'react-native';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import PatientDashboard from './screens/PatientDashboard';
import DoctorDashboard from './screens/DoctorDashboard';
import VideoCallScreen from './screens/VideoCallScreen';
import MedicalHistoryScreen from './screens/MedicalHistoryScreen';
import AppointmentBookingScreen from './screens/AppointmentBookingScreen';
import DoctorAvailabilityScreen from './screens/DoctorAvailabilityScreen';
import AppointmentDetailsScreen from './screens/AppointmentDetailsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return (
      <Tab.Navigator>
        <Tab.Screen name="Dashboard" component={DoctorDashboard} />
        <Tab.Screen name="Availability" component={DoctorAvailabilityScreen} />
        <Tab.Screen name="History" component={MedicalHistoryScreen} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={PatientDashboard} />
      <Tab.Screen name="Book" component={AppointmentBookingScreen} />
      <Tab.Screen name="History" component={MedicalHistoryScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} />
            <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
