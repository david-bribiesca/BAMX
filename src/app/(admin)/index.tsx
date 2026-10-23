import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeafletMap } from '@/components/LeafletMap';
import { PrimaryButton } from '@/components/ui';
import {
  approveDonation,
  getLocations,
  getPendingDonations,
  type Location,
  type PendingDonation,
} from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

export default function AdminScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [pending, setPending] = useState<PendingDonation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [locs, pend] = await Promise.all([getLocations(), getPendingDonations()]);
      setLocations(locs);
      setPending(pend);
      setSelectedId((cur) => cur ?? locs[0]?.id ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los datos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const countByLocation = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of pending) {
      if (d.location_id) m.set(d.location_id, (m.get(d.location_id) ?? 0) + 1);
    }
    return m;
  }, [pending]);

  const selected = locations.find((l) => l.id === selectedId) ?? null;
  const selectedPending = pending.filter((d) => d.location_id === selectedId);

  async function onApprove(id: string) {
    setError(null);
    setApprovingId(id);
    try {
      await approveDonation(id);
      setPending((cur) => cur.filter((d) => d.id !== id));
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo aprobar la donación.');
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
        <Text style={styles.intro}>
          {pending.length} donación(es) pendiente(s). Elige un punto de acopio para
          revisarlas y aprobarlas.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.mapWrap}>
          <LeafletMap
            locations={locations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            height={280}
          />
        </View>

        {selected && (
          <View style={styles.card}>
            <Text style={styles.locName}>{selected.name}</Text>
            {!!selected.address && (
              <Text style={styles.locAddr}>📍 {selected.address}</Text>
            )}

            <Text style={styles.subheading}>Donaciones pendientes</Text>
            {selectedPending.length === 0 ? (
              <Text style={styles.muted}>No hay donaciones pendientes aquí. ✅</Text>
            ) : (
              selectedPending.map((d) => (
                <View key={d.id} style={styles.donation}>
                  <Text style={styles.donationTitle}>
                    {d.kind === 'dinero' ? '💵 Dinero' : `📦 ${d.items}`} ·{' '}
                    {d.kind === 'dinero' ? `$${d.quantity} MXN` : `${d.quantity} unidad(es)`}
                  </Text>
                  <Text style={styles.donationMeta}>
                    {d.donor_name ?? 'Donador'} ·{' '}
                    {new Date(d.created_at).toLocaleDateString('es-MX')}
                  </Text>
                  <View style={{ height: spacing.sm }} />
                  <PrimaryButton
                    label="Aprobar"
                    onPress={() => onApprove(d.id)}
                    loading={approvingId === d.id}
                    disabled={approvingId !== null}
                  />
                </View>
              ))
            )}
          </View>
        )}

        <Text style={styles.listHeading}>Todos los puntos</Text>
        {locations.map((loc) => {
          const count = countByLocation.get(loc.id) ?? 0;
          return (
            <Pressable
              key={loc.id}
              onPress={() => setSelectedId(loc.id)}
              style={[styles.listItem, loc.id === selectedId && styles.listItemActive]}
            >
              <Text style={styles.listItemName}>{loc.name}</Text>
              <View style={[styles.badge, count === 0 && styles.badgeZero]}>
                <Text style={[styles.badgeText, count === 0 && styles.badgeTextZero]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  intro: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  error: { color: colors.primary, fontSize: 13, fontWeight: '600', marginBottom: spacing.md },
  mapWrap: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  locName: { fontSize: 18, fontWeight: '800', color: colors.text },
  locAddr: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  subheading: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  muted: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  donation: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  donationTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  donationMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  listHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  listItem: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  listItemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  badge: {
    minWidth: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  badgeZero: { backgroundColor: colors.surfaceAlt },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  badgeTextZero: { color: colors.textMuted },
});
