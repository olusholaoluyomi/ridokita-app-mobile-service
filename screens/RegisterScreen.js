import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL } from '../config';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        '#F8F1E8',
  surface:   '#FFFFFF',
  surface2:  '#F4EBE0',
  surface3:  '#ECDFD0',
  ink:       '#261820',
  ink2:      '#6B5560',
  muted:     '#A89499',
  brand:     '#F47B6B',
  brandDeep: '#D9543F',
  brandSoft: '#FCE4DE',
  accent:    '#6C4FCB',
  sage:      '#6FAE94',
  sageSoft:  '#DEEDE5',
  line:      'rgba(38, 24, 32, 0.08)',
  line2:     'rgba(38, 24, 32, 0.14)',
};

// ─── Tiny SVG-free icon components ────────────────────────────────────────────
function IconArrowLeft({ color = T.ink, size = 20 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.55, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          width: size * 0.32,
          height: size * 0.32,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function IconHeart({ color = T.brand, size = 24 }) {
  // Two overlapping rounded squares forming a heart-ish shape
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.55,
          height: size * 0.55,
          backgroundColor: color,
          borderRadius: size * 0.14,
          transform: [{ rotate: '-45deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.06,
          left: size * 0.06,
          width: size * 0.4,
          height: size * 0.4,
          backgroundColor: color,
          borderRadius: size * 0.2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.06,
          right: size * 0.06,
          width: size * 0.4,
          height: size * 0.4,
          backgroundColor: color,
          borderRadius: size * 0.2,
        }}
      />
    </View>
  );
}

function IconStethoscope({ color = T.accent, size = 24 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderWidth: 2.5,
          borderColor: color,
          borderRadius: size * 0.25,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.05,
          right: size * 0.15,
          width: size * 0.22,
          height: size * 0.22,
          borderWidth: 2.5,
          borderColor: color,
          borderRadius: size * 0.11,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: size * 0.26,
          right: size * 0.26,
          width: 2.5,
          height: size * 0.3,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </View>
  );
}

function IconEye({ color = T.muted, size = 20, closed = false }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.75,
          height: size * 0.45,
          borderWidth: 2,
          borderColor: color,
          borderRadius: size * 0.22,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.25,
          height: size * 0.25,
          backgroundColor: color,
          borderRadius: size * 0.125,
        }}
      />
      {closed && (
        <View
          style={{
            position: 'absolute',
            width: size * 0.8,
            height: 2,
            backgroundColor: T.surface,
            transform: [{ rotate: '-20deg' }],
          }}
        />
      )}
    </View>
  );
}

function IconShield({ color = T.brand, size = 22 }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: size * 0.65,
          height: size * 0.78,
          borderWidth: 2.5,
          borderColor: color,
          borderRadius: size * 0.16,
          borderBottomLeftRadius: size * 0.32,
          borderBottomRightRadius: size * 0.32,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.3,
          width: size * 0.28,
          height: size * 0.18,
          borderBottomWidth: 2.5,
          borderLeftWidth: 2.5,
          borderColor: color,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total = 3 }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            { flex: 1, marginHorizontal: 3 },
            i <= step ? styles.progressActive : styles.progressInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Labelled input ───────────────────────────────────────────────────────────
function Field({ label, focused, children }) {
  return (
    <View style={styles.fieldWrapper}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  // Existing state variables — unchanged
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [name, setName]                 = useState('');
  const [phone, setPhone]               = useState('');
  const [role, setRole]                 = useState('patient');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber]   = useState('');

  // New UI state
  const [step, setStep]                 = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // ── Existing API logic — untouched ─────────────────────────────────────────
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
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 0) {
      navigation.navigate('Login');
    } else {
      setStep(step - 1);
    }
  };

  const goNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        Alert.alert('Missing info', 'Please fill in all required fields.');
        return;
      }
      if (role === 'doctor' && (!specialization.trim() || !licenseNumber.trim())) {
        Alert.alert('Missing info', 'Please enter your specialty and license number.');
        return;
      }
      setStep(2);
    }
  };

  // ── Input style helper ──────────────────────────────────────────────────────
  const inputStyle = (fieldName) => [
    styles.input,
    focusedField === fieldName && styles.inputFocused,
  ];

  // ── Shared header ───────────────────────────────────────────────────────────
  const Header = ({ title, subtitle }) => (
    <View style={styles.headerBlock}>
      <Text style={styles.heading}>{title}</Text>
      {subtitle ? <Text style={styles.subheading}>{subtitle}</Text> : null}
    </View>
  );

  // ── Step 0: Role selection ──────────────────────────────────────────────────
  const RoleCard = ({ value, label, hint, IconComponent }) => {
    const selected = role === value;
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => setRole(value)}
        style={[styles.roleCard, selected && styles.roleCardSelected]}
      >
        <View style={[styles.roleIconBox, selected && styles.roleIconBoxSelected]}>
          <IconComponent
            color={selected ? T.brand : T.ink2}
            size={26}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>
            {label}
          </Text>
          <Text style={styles.roleHint}>{hint}</Text>
        </View>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  const StepRole = () => (
    <>
      <Header
        title="Who's joining?"
        subtitle="We'll tailor the experience for you."
      />
      <View style={styles.roleCards}>
        <RoleCard
          value="patient"
          label="I need care"
          hint="Find doctors, book appointments"
          IconComponent={IconHeart}
        />
        <RoleCard
          value="doctor"
          label="I give care"
          hint="Manage patients, consultations"
          IconComponent={IconStethoscope}
        />
      </View>
    </>
  );

  // ── Step 1: Personal details ────────────────────────────────────────────────
  const StepDetails = () => (
    <>
      <Header title="Tell us about you" />
      <Field label="FULL NAME">
        <TextInput
          style={inputStyle('name')}
          placeholder="Jane Doe"
          placeholderTextColor={T.muted}
          value={name}
          onChangeText={setName}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>
      <Field label="EMAIL">
        <TextInput
          style={inputStyle('email')}
          placeholder="jane@example.com"
          placeholderTextColor={T.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>
      <Field label="PHONE">
        <TextInput
          style={inputStyle('phone')}
          placeholder="+234 800 000 0000"
          placeholderTextColor={T.muted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          onFocus={() => setFocusedField('phone')}
          onBlur={() => setFocusedField(null)}
        />
      </Field>
      {role === 'doctor' && (
        <>
          <Field label="SPECIALTY">
            <TextInput
              style={inputStyle('specialization')}
              placeholder="e.g. Cardiology"
              placeholderTextColor={T.muted}
              value={specialization}
              onChangeText={setSpecialization}
              onFocus={() => setFocusedField('specialization')}
              onBlur={() => setFocusedField(null)}
            />
          </Field>
          <Field label="LICENSE NUMBER">
            <TextInput
              style={inputStyle('licenseNumber')}
              placeholder="MDC-XXXXXXXX"
              placeholderTextColor={T.muted}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
              onFocus={() => setFocusedField('licenseNumber')}
              onBlur={() => setFocusedField(null)}
            />
          </Field>
        </>
      )}
    </>
  );

  // ── Step 2: Password ────────────────────────────────────────────────────────
  const StepPassword = () => (
    <>
      <Header
        title="Secure your account"
        subtitle="Choose a password. We use biometric unlock after sign-in."
      />
      <Field label="PASSWORD">
        <View style={styles.passwordRow}>
          <TextInput
            style={[inputStyle('password'), styles.passwordInput]}
            placeholder="Min. 8 characters"
            placeholderTextColor={T.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconEye color={T.muted} size={20} closed={!showPassword} />
          </TouchableOpacity>
        </View>
      </Field>

      {/* Security notice */}
      <View style={styles.securityCard}>
        <View style={styles.securityIconWrap}>
          <IconShield color={T.brand} size={22} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.securityTitle}>HIPAA &amp; NDPR compliant</Text>
          <Text style={styles.securityBody}>
            Your health data is end-to-end encrypted and never sold to third parties.
          </Text>
        </View>
      </View>

      {/* Already have account */}
      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginLinkText}>
          Already have an account?{' '}
          <Text style={styles.loginLinkBold}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  const isFinalStep = step === 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={goBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconArrowLeft color={T.ink} size={20} />
        </TouchableOpacity>
        <ProgressBar step={step} total={3} />
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && <StepRole />}
        {step === 1 && <StepDetails />}
        {step === 2 && <StepPassword />}

        {/* Primary action button */}
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.86}
          onPress={isFinalStep ? handleRegister : goNext}
        >
          <Text style={styles.primaryBtnText}>
            {isFinalStep ? 'Create account' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: T.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: T.ink,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },

  // Progress bar
  progressRow: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 12,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressSegment: {
    borderRadius: 2,
    height: 4,
  },
  progressActive: {
    backgroundColor: T.brand,
  },
  progressInactive: {
    backgroundColor: T.line2,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },

  // Header
  headerBlock: { marginBottom: 28 },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: T.ink,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: T.muted,
    lineHeight: 20,
  },

  // Role cards
  roleCards: { gap: 12 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: T.ink,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  roleCardSelected: {
    backgroundColor: T.brandSoft,
    borderColor: T.brand,
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: T.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconBoxSelected: {
    backgroundColor: T.brand + '22',
  },
  roleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: T.ink,
    marginBottom: 2,
  },
  roleLabelSelected: { color: T.brandDeep },
  roleHint: {
    fontSize: 12,
    color: T.muted,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: T.line2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioOuterSelected: { borderColor: T.brand },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.brand,
  },

  // Fields
  fieldWrapper: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: T.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: T.line2,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
    fontSize: 15,
    color: T.ink,
  },
  inputFocused: {
    borderColor: T.brand,
    backgroundColor: T.surface,
  },

  // Password row
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
  },

  // Security card
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: T.brandSoft,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  securityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: T.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: T.brandDeep,
    marginBottom: 3,
  },
  securityBody: {
    fontSize: 12,
    color: T.ink2,
    lineHeight: 17,
  },

  // Login link
  loginLink: {
    alignItems: 'center',
    marginBottom: 4,
  },
  loginLinkText: {
    fontSize: 14,
    color: T.muted,
  },
  loginLinkBold: {
    color: T.brand,
    fontWeight: '600',
  },

  // Primary button
  primaryBtn: {
    backgroundColor: T.brand,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: T.brandDeep,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  primaryBtnText: {
    color: T.surface,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
