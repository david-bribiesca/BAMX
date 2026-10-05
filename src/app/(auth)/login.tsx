// Login screen — matches mockup p.1 ("Menú principal").
// Role selector + email/password. Shows a clear error on wrong credentials.
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/components/Brand';
import { Field, PrimaryButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme';

const ROLES = [
  { key: 'donor', title: 'Donador', subtitle: 'Quiero donar y apoyar', emoji: '💛' },
  { key: 'beneficiary', title: 'Necesito apoyo', subtitle: 'Quiero recibir ayuda', emoji: '🙌' },
  { key: 'staff', title: 'Staff BAMX', subtitle: 'Soy del equipo BAMX', emoji: '⭐' },
] as const;

export default function Login() {
  const [role, setRole] = useState<string>('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setError(null);

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    // WRONG response -> show error. RIGHT response -> the auth listener in
    // AuthProvider fires and the root layout redirects into the app.
    if (authError) {
      setError('Correo o contraseña incorrectos. Inténtalo de nuevo.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Brand />
          </View>

          <Text style={styles.question}>¿Cómo quieres entrar?</Text>

          {ROLES.map((r) => {
            const selected = role === r.key;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRole(r.key)}
                style={[styles.roleCard, selected && styles.roleCardActive]}
              >
                <Text style={styles.roleEmoji}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, selected && { color: colors.primary }]}>
                    {r.title}
                  </Text>
                  <Text style={styles.roleSubtitle}>{r.subtitle}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioActive]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}

          <View style={{ height: spacing.lg }} />

          <Field
            label="Correo"
            placeholder="maria@correo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Field
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton label="Entrar" onPress={onLogin} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Primera vez? </Text>
            <Link href="/(auth)/signup" style={styles.footerLink}>
              Regístrate gratis
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.sm },
  question: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleEmoji: { fontSize: 22, marginRight: spacing.md },
  roleTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  roleSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  error: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
