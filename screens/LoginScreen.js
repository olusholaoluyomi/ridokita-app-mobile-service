import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import { colors, radius, shadow, typography } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await response.json();
      if (response.ok) {
        await login(data.token, data.user);
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>R</Text>
          </View>
          <Text style={styles.logoText}>Ridokita</Text>
        </View>

        {/* Heading */}
        <Text style={styles.display}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your care journey.</Text>

        {/* Role segmented control */}
        <View style={styles.segmentTrack}>
          <TouchableOpacity
            style={[styles.segmentTab, role === 'patient' && styles.segmentTabActive]}
            onPress={() => setRole('patient')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentLabel, role === 'patient' && styles.segmentLabelActive]}>
              Patient
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, role === 'doctor' && styles.segmentTabActive]}
            onPress={() => setRole('doctor')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentLabel, role === 'doctor' && styles.segmentLabelActive]}>
              Doctor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Email field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            style={[styles.input, emailFocused && styles.inputFocused]}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />
        </View>

        {/* Password field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <View style={[styles.inputRow, passwordFocused && styles.inputFocused]}>
            <TextInput
              style={styles.inputInner}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot password */}
        <TouchableOpacity style={styles.forgotRow} activeOpacity={0.7}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Sign in button */}
        <TouchableOpacity
          style={[styles.signInBtn, shadow.coral]}
          onPress={handleLogin}
          activeOpacity={0.85}
        >
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social buttons */}
        <View style={styles.socialRow}>
          <TouchableOpacity style={[styles.socialBtn, shadow.soft]} activeOpacity={0.8}>
            <Text style={styles.socialBtnText}>G</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, shadow.soft]} activeOpacity={0.8}>
            <Text style={styles.socialBtnText}>☎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, shadow.soft]} activeOpacity={0.8}>
            <Text style={styles.socialBtnText}></Text>
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <TouchableOpacity
          style={styles.registerRow}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.7}
        >
          <Text style={styles.registerText}>
            New to Ridokita?{' '}
            <Text style={styles.registerLink}>Create an account</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Logo
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoLetter: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  logoText: {
    ...typography.h2,
    color: colors.brand,
  },

  // Headings
  display: {
    ...typography.display,
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginBottom: 28,
  },

  // Segmented control
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: 28,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentTabActive: {
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  segmentLabel: {
    ...typography.sm,
    fontWeight: '600',
    color: colors.muted,
  },
  segmentLabelActive: {
    color: colors.ink,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    ...typography.eyebrow,
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...typography.body,
    color: colors.ink,
  },
  inputFocused: {
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 14,
    ...typography.body,
    color: colors.ink,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Forgot password
  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    ...typography.sm,
    color: colors.brand,
    fontWeight: '600',
  },

  // Sign in button
  signInBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  signInText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line2,
  },
  dividerText: {
    ...typography.sm,
    color: colors.muted,
    marginHorizontal: 12,
  },

  // Social buttons
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  socialBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },

  // Register link
  registerRow: {
    alignItems: 'center',
  },
  registerText: {
    ...typography.body,
    color: colors.ink2,
  },
  registerLink: {
    color: colors.brand,
    fontWeight: '700',
  },
});
