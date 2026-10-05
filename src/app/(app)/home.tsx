// Donor home — READS from the backend and displays it:
//   • "Campañas activas"  (campaigns table)
//   • "Mis donaciones"    (donations table, only the user's own rows via RLS)
// Also shows quick stats and a button into the new-donation flow.
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, PrimaryButton, StatusChip } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import {
  getActiveCampaigns,
  getMyDonations,
  type Campaign,
  type Donation,
} from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

export default function Home() {
  const router = useRouter();
  const { session, profile, signOut } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user) return;
    setError(null);
    try {
      const [c, d] = await Promise.all([
        getActiveCampaigns(),
        getMyDonations(session.user.id),
      ]);
      setCampaigns(c);
      setDonations(d);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  // Reload every time the screen gains focus (e.g. after saving a donation).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const firstName = (profile?.full_name ?? 'Donador').split(' ')[0];
  const totalUnits = donations.reduce((sum, d) => sum + (d.quantity ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.hello}>Hola, {firstName} 👋</Text>
          <Text style={styles.subtitle}>Gracias por apoyar a BAMX</Text>
        </View>
        <Text style={styles.signout} onPress={signOut}>
          Salir
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Quick stats */}
        <View style={styles.statsRow}>
          <Stat value={donations.length} label="Donaciones" />
          <Stat value={totalUnits} label="Despensas / unidades" />
        </View>

        <PrimaryButton
          label="+  Nueva Donación"
          onPress={() => router.push('/(app)/donate')}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Campañas activas (READ) */}
        <Text style={styles.section}>Campañas activas</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : campaigns.length === 0 ? (
          <Text style={styles.empty}>No hay campañas activas por ahora.</Text>
        ) : (
          campaigns.map((c) => (
            <Card key={c.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{c.name}</Text>
              {!!c.description && (
                <Text style={styles.itemDesc}>{c.description}</Text>
              )}
              <View style={styles.metaRow}>
                {!!c.location_name && (
                  <Text style={styles.meta}>📍 {c.location_name}</Text>
                )}
                {!!c.goal_meals && (
                  <Text style={styles.meta}>🎯 Meta: {c.goal_meals} despensas</Text>
                )}
              </View>
            </Card>
          ))
        )}

        {/* Mis donaciones (READ) */}
        <Text style={styles.section}>Mis donaciones</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : donations.length === 0 ? (
          <Text style={styles.empty}>
            Aún no has hecho donaciones. ¡Empieza con una!
          </Text>
        ) : (
          donations.map((d) => (
            <Card key={d.id} style={styles.itemCard}>
              <View style={styles.donationHeader}>
                <Text style={styles.itemTitle}>
                  {d.kind === 'dinero' ? '💵 Donación en dinero' : '📦 ' + d.items}
                </Text>
                <StatusChip status={d.status} />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  {d.kind === 'dinero'
                    ? `$${d.quantity} MXN`
                    : `${d.quantity} unidad(es)`}
                </Text>
                {!!d.campaigns?.name && (
                  <Text style={styles.meta}>· {d.campaigns.name}</Text>
                )}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceAlt },
  topBar: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hello: { color: colors.white, fontSize: 20, fontWeight: '800' },
  subtitle: { color: '#FFD7DE', fontSize: 13, marginTop: 2 },
  signout: { color: colors.white, fontSize: 14, fontWeight: '700' },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  stat: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  section: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  itemCard: { marginBottom: spacing.md },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  itemDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  meta: { fontSize: 12, color: colors.textMuted },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  empty: { color: colors.textMuted, fontSize: 14, fontStyle: 'italic' },
  error: { color: colors.primary, fontSize: 13, marginTop: spacing.md, fontWeight: '600' },
});
