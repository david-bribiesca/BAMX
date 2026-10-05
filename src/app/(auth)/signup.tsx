// Sign-up screen with role selection (Donador / Necesito apoyo / Staff).
// full_name + role are passed as user metadata; a DB trigger copies them into
// the profiles table (see supabase/schema.sql).
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
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brand } from '@/components/Brand';
import { Field, PrimaryButton } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme';

const ROLES = [
  { key: 'donor', title: 'Donador', emoji: '💛' },
  { key: 'beneficiary', title: 'Necesito apoyo', emoji: '🙌' },
  { key: 'staff', title: 'Staff BAMX', emoji: '⭐' },
] as const;

export default function SignUp() {
  const router = useRouter();
  const [role, setRole] = useState<string>('donor');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignUp() {
    setError(null);
    setNotice(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), role },
      },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // If email confirmation is OFF, a session is returned and the root layout
    // redirects into the app automatically. If it's ON, session is null.
    if (!data.session) {
      setNotice(
        'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.'
      );
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
            <Brand tagline={false} />
            <Text style={styles.title}>Crea tu cuenta</Text>
          </View>

          <Text style={styles.question}>¿Cómo quieres registrarte?</Text>
          <View style={styles.rolesRow}>
            {ROLES.map((r) => {
              const selected = role === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRole(r.key)}
                  style={[styles.rolePill, selected && styles.rolePillActive]}
                >
                  <Text style={styles.roleEmoji}>{r.emoji}</Text>
                  <Text
                    style={[styles.rolePillText, selected && { color: colors.primary }]}
                  >
                    {r.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ height: spacing.lg }} />

          <Field
            label="Nombre completo"
            placeholder="María Pérez"
            value={fullName}
            onChangeText={setFullName}
          />
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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {notice && <Text style={styles.notice}>{notice}</Text>}

          <PrimaryButton
            label="Registrarme"
            onPress={onSignUp}
            loading={loading}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" style={styles.footerLink}>
              Inicia sesión
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
  },
  question: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  rolesRow: { flexDirection: 'row', gap: spacing.sm },
  rolePill: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  rolePillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleEmoji: { fontSize: 20, marginBottom: 4 },
  rolePillText: { fontSize: 12, fontWeight: '700', color: colors.text, textAlign: 'center' },
  error: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  notice: {
    color: colors.success,
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
