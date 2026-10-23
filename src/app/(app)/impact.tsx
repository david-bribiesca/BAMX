import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusChip } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { getMyDonations, isConfirmed, type Donation } from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

const LEVELS = [
  { name: 'Bronce', emoji: '🥉', min: 0 },
  { name: 'Plata', emoji: '🥈', min: 10 },
  { name: 'Oro', emoji: '🥇', min: 30 },
  { name: 'Platino', emoji: '💎', min: 60 },
];

export default function Impact() {
  const { session, profile, signOut } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user) return;
    try {
      setDonations(await getMyDonations(session.user.id));
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const stats = useMemo(() => {
    const confirmed = donations.filter(isConfirmed);
    const units = confirmed
      .filter((d) => d.kind === 'especie')
      .reduce((sum, d) => sum + (d.quantity ?? 0), 0);
    const locations = new Set(
      confirmed.map((d) => d.location_id).filter(Boolean)
    ).size;
    const months = new Set(
      confirmed.map((d) => d.created_at?.slice(0, 7)).filter(Boolean)
    ).size;
    const pending = donations.length - confirmed.length;
    return { count: confirmed.length, units, locations, months, pending };
  }, [donations]);

  const levelIdx = LEVELS.reduce(
    (acc, lvl, i) => (stats.units >= lvl.min ? i : acc),
    0
  );
  const level = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1] ?? null;
  const progress = next
    ? Math.min(1, (stats.units - level.min) / (next.min - level.min))
    : 1;

  const badges = [
    { emoji: '🎁', title: 'Primera donación', earned: stats.count >= 1 },
    { emoji: '🗺️', title: 'Explorador', earned: stats.locations >= 3 },
    { emoji: '🔥', title: 'En racha', earned: stats.months >= 2 },
    { emoji: '🏅', title: 'Generoso', earned: stats.units >= 30 },
    { emoji: '💯', title: 'Centenario', earned: stats.units >= 100 },
    { emoji: '⭐', title: 'Leyenda BAMX', earned: stats.units >= 60 },
  ];

  const firstName = (profile?.full_name ?? 'Donador').split(' ')[0];

  async function onShare() {
    const message =
      `¡Soy Donador ${level.name} ${level.emoji} en BAMX Guadalajara! 💛 ` +
      `He donado ${stats.units} despensas en ${stats.count} donaciones. ` +
      `¡Súmate a ayudar! 🙌`;

    if (Platform.OS === 'web') {
      const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav?.share) {
        try {
          await nav.share({ text: message });
        } catch {
        }
        return;
      }
      if (nav?.clipboard?.writeText) {
        try {
          await nav.clipboard.writeText(message);
          window.alert('Tu impacto se copió al portapapeles. 💛');
          return;
        } catch {
        }
      }
      window.alert(message);
      return;
    }

    try {
      await Share.share({ message });
    } catch {
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
        <View style={styles.topRow}>
          <Text style={styles.greeting}>¡Gracias, {firstName}! 💛</Text>
          <Text style={styles.signout} onPress={signOut}>
            Salir
          </Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{level.emoji}</Text>
          <Text style={styles.heroLevel}>Donador {level.name}</Text>
          <Text style={styles.heroUnits}>{stats.units} despensas donadas</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {next
              ? `${next.min - stats.units} para alcanzar ${next.name} ${next.emoji}`
              : '¡Nivel máximo alcanzado! 🎉'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <Stat value={stats.count} label="Donaciones" />
          <Stat value={stats.units} label="Despensas" />
          <Stat value={stats.locations} label="Puntos visitados" />
          <Stat value={stats.months} label="Meses activo" />
        </View>

        <Text style={styles.section}>Insignias</Text>
        <View style={styles.badgeGrid}>
          {badges.map((b) => (
            <View
              key={b.title}
              style={[styles.badge, !b.earned && styles.badgeLocked]}
            >
              <Text style={[styles.badgeEmoji, !b.earned && styles.badgeEmojiLocked]}>
                {b.earned ? b.emoji : '🔒'}
              </Text>
              <Text style={styles.badgeTitle} numberOfLines={2}>
                {b.title}
              </Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.shareBtn} onPress={onShare}>
          <Text style={styles.shareBtnText}>Compartir mi impacto</Text>
        </Pressable>

        <Text style={styles.section}>Mis donaciones</Text>
        {stats.pending > 0 && (
          <Text style={styles.pendingNote}>
            ⏳ {stats.pending} donación(es) pendiente(s) de confirmar. Contarán en tus
            estadísticas cuando un administrador las apruebe.
          </Text>
        )}
        {donations.length === 0 ? (
          <Text style={styles.empty}>
            Aún no has donado. ¡Haz tu primera donación y gana tu primera insignia! 🎁
          </Text>
        ) : (
          donations.map((d) => (
            <View key={d.id} style={styles.donationCard}>
              <View style={styles.donationHeader}>
                <Text style={styles.donationTitle}>
                  {d.kind === 'dinero' ? '💵 Donación en dinero' : `📦 ${d.items}`}
                </Text>
                <StatusChip status={d.status} />
              </View>
              <Text style={styles.donationMeta}>
                {d.kind === 'dinero' ? `$${d.quantity} MXN` : `${d.quantity} unidad(es)`}
                {d.locations?.name ? ` · ${d.locations.name}` : ''}
              </Text>
            </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  greeting: { fontSize: 18, fontWeight: '800', color: colors.text },
  signout: { fontSize: 14, fontWeight: '700', color: colors.primary },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 48 },
  heroLevel: { fontSize: 22, fontWeight: '800', color: colors.white, marginTop: spacing.sm },
  heroUnits: { fontSize: 14, color: '#FFD7DE', marginTop: 2 },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: { height: 10, borderRadius: radius.pill, backgroundColor: colors.white },
  progressText: { fontSize: 13, color: colors.white, fontWeight: '600', marginTop: spacing.sm },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  section: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  badgeLocked: { opacity: 0.55, backgroundColor: colors.surfaceAlt },
  badgeEmoji: { fontSize: 30 },
  badgeEmojiLocked: { fontSize: 24 },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  shareBtn: {
    marginTop: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  empty: { color: colors.textMuted, fontSize: 14, fontStyle: 'italic' },
  pendingNote: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md },
  donationCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  donationTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  donationMeta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
});
