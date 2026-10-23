import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeafletMap } from '@/components/LeafletMap';
import { PrimaryButton } from '@/components/ui';
import { getLocations, type Location } from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

export default function MapScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getLocations();
      setLocations(data);
      setSelectedId((cur) => cur ?? data[0]?.id ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los puntos de acopio.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selected = locations.find((l) => l.id === selectedId) ?? null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Explora el mapa, elige un punto de acopio y mira qué se necesita hoy.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.mapWrap}>
          <LeafletMap
            locations={locations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            height={320}
          />
        </View>

        {selected && (
          <View style={styles.card}>
            <Text style={styles.locName}>{selected.name}</Text>
            {!!selected.address && (
              <Text style={styles.locAddr}>📍 {selected.address}</Text>
            )}

            <Text style={styles.subheading}>Se necesita ahora</Text>
            {selected.needed_goods.length === 0 ? (
              <Text style={styles.muted}>Sin necesidades urgentes.</Text>
            ) : (
              <View style={styles.chipRow}>
                {selected.needed_goods.map((g) => (
                  <View key={g} style={[styles.chip, styles.chipNeeded]}>
                    <Text style={styles.chipNeededText}>🔴 {g}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.subheading}>Se puede donar aquí</Text>
            <View style={styles.chipRow}>
              {selected.accepted_goods.map((g) => (
                <View key={g} style={styles.chip}>
                  <Text style={styles.chipText}>{g}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: spacing.lg }} />
            <PrimaryButton
              label="Donar aquí"
              onPress={() =>
                router.push({
                  pathname: '/(app)/donate',
                  params: { locationId: selected.id },
                })
              }
            />
          </View>
        )}

        <Text style={styles.listHeading}>Todos los puntos</Text>
        {locations.map((loc) => (
          <Pressable
            key={loc.id}
            onPress={() => setSelectedId(loc.id)}
            style={[styles.listItem, loc.id === selectedId && styles.listItemActive]}
          >
            <Text style={styles.listItemName}>{loc.name}</Text>
            <Text style={styles.listItemMeta}>
              {loc.needed_goods.length > 0
                ? `Necesita: ${loc.needed_goods.join(', ')}`
                : 'Sin necesidades urgentes'}
            </Text>
          </Pressable>
        ))}
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  chipNeeded: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipNeededText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
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
  },
  listItemActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  listItemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  listItemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
