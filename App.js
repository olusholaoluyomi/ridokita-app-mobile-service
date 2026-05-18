import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import * as Notifications from 'expo-notifications';

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

const TAB_OPTS = {
  tabBarActiveTintColor: '#F47B6B',
  tabBarInactiveTintColor: '#A89499',
  headerShown: false,
  tabBarStyle: {
    backgroundColor: '#FFFFFF',
    borderTopColor: 'rgba(38, 24, 32, 0.08)',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 6,
    height: 62,
  },
  tabBarLabelStyle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
};

function TabNavigator() {
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return (
      <Tab.Navigator screenOptions={TAB_OPTS}>
        <Tab.Screen name="Today" component={DoctorDashboard}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
        <Tab.Screen name="Availability" component={DoctorAvailabilityScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text> }} />
        <Tab.Screen name="Records" component={MedicalHistoryScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text> }} />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={TAB_OPTS}>
      <Tab.Screen name="Home" component={PatientDashboard}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text> }} />
      <Tab.Screen name="Book" component={AppointmentBookingScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🩺</Text> }} />
      <Tab.Screen name="Records" component={MedicalHistoryScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text> }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingLogo}>
          <Text style={styles.loadingLogoText}>R</Text>
        </View>
        <Text style={styles.loadingTitle}>Ridokita</Text>
        <Text style={styles.loadingSubtitle}>Care, close to home.</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#F8F1E8' },
          headerTintColor: '#261820',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ title: 'Video Call' }} />
            <Stack.Screen name="AppointmentDetails" component={AppointmentDetailsScreen} options={{ title: 'Details' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
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
      <StatusBar style="dark" backgroundColor="#F8F1E8" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#F8F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#F47B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingLogoText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '400',
    color: '#F47B6B',
    marginBottom: 6,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#A89499',
  },
});
