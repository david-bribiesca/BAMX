// Login screen (donor-only). Email/password; shows a clear error on bad creds.
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { colors, spacing } from '@/theme';

export default function Login() {
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

          <Text style={styles.welcome}>Bienvenido de nuevo</Text>
          <Text style={styles.sub}>Inicia sesión para seguir donando.</Text>

          <View style={{ height: spacing.xl }} />

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
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  welcome: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  error: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
