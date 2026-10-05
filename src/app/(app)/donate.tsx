// New donation flow — SAVES data into the backend.
// Choose type (En especie / Dinero), campaign, items and quantity, then insert
// a row into the donations table. On success, go back to the home list.
import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Field, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { createDonation, getActiveCampaigns, type Campaign } from '@/lib/db';
import { colors, radius, spacing } from '@/theme';

type Kind = 'especie' | 'dinero';

export default function Donate() {
  const router = useRouter();
  const { session } = useAuth();

  const [kind, setKind] = useState<Kind>('especie');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [items, setItems] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getActiveCampaigns()
        .then(setCampaigns)
        .catch(() => setCampaigns([]));
    }, [])
  );

  async function onSave() {
    setError(null);
    if (!session?.user) return;

    const qty = Number(quantity);
    if (kind === 'especie' && !items.trim()) {
      setError('Describe qué vas a donar.');
      return;
    }
    if (!quantity || Number.isNaN(qty) || qty <= 0) {
      setError(
        kind === 'dinero'
          ? 'Ingresa un monto válido.'
          : 'Ingresa una cantidad válida.'
      );
      return;
    }

    setSaving(true);
    try {
      await createDonation({
        donorId: session.user.id,
        campaignId,
        kind,
        items: kind === 'dinero' ? 'Donación en dinero' : items.trim(),
        quantity: qty,
      });
      // Confirm success, then return to the list. Navigate right away so it
      // works on web too (where Alert button callbacks don't fire); the home
      // screen re-fetches on focus and shows the new donation.
      Alert.alert('¡Listo! 🎉', '¡Tu donación fue enviada con éxito!');
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar la donación.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.surfaceAlt }}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type selector */}
        <Text style={styles.label}>Tipo de donación</Text>
        <View style={styles.segment}>
          <SegmentButton
            active={kind === 'especie'}
            label="📦 En especie"
            onPress={() => setKind('especie')}
          />
          <SegmentButton
            active={kind === 'dinero'}
            label="💵 Dinero"
            onPress={() => setKind('dinero')}
          />
        </View>

        {/* Campaign picker */}
        <Text style={styles.label}>Campaña</Text>
        <View style={{ marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => setCampaignId(null)}
            style={[styles.campaign, campaignId === null && styles.campaignActive]}
          >
            <Text style={[styles.campaignText, campaignId === null && styles.campaignTextActive]}>
              Donación general
            </Text>
          </Pressable>
          {campaigns.map((c) => {
            const active = campaignId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCampaignId(c.id)}
                style={[styles.campaign, active && styles.campaignActive]}
              >
                <Text style={[styles.campaignText, active && styles.campaignTextActive]}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Items (only for in-kind) */}
        {kind === 'especie' && (
          <Field
            label="¿Qué vas a donar?"
            placeholder="Ej. Arroz, frijol, leche..."
            value={items}
            onChangeText={setItems}
          />
        )}

        <Field
          label={kind === 'dinero' ? 'Monto (MXN)' : 'Cantidad (unidades)'}
          placeholder={kind === 'dinero' ? '500' : '10'}
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton
          label="Confirmar donación"
          onPress={onSave}
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SegmentButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentBtn, active && styles.segmentBtnActive]}
    >
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  segment: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  segmentBtn: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  segmentText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  segmentTextActive: { color: colors.primary },
  campaign: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  campaignActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  campaignText: { fontSize: 14, fontWeight: '600', color: colors.text },
  campaignTextActive: { color: colors.primary },
  error: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
