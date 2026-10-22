// New donation flow — SAVES an in-kind donation into the backend.
// Opened from the map with a locationId -> locked to that drop-off point, and
// the items field becomes a dropdown of what that point accepts.
// Opened from the Donar tab -> you first pick a point, then the same dropdown.
// "Donar dinero" is a placeholder for now (wired up in a later prompt).
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Field, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { createDonation, getLocations, type Location } from '@/lib/db';
import { confirmMoneyDonation, startMoneyDonation } from '@/lib/payments';
import { colors, radius, spacing } from '@/theme';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Kind = 'especie' | 'dinero';

export default function Donate() {
  const router = useRouter();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ locationId?: string }>();
  const lockedId = params.locationId ?? null; // came from "Donar aquí"

  const [kind, setKind] = useState<Kind>('especie');
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Money-donation (Stripe) state.
  const [money, setMoney] = useState('');
  const [payState, setPayState] = useState<'idle' | 'processing'>('idle');
  const [payError, setPayError] = useState<string | null>(null);
  const cancelPayRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      getLocations()
        .then((locs) => {
          setLocations(locs);
          setLocationId((cur) => lockedId ?? cur ?? locs[0]?.id ?? null);
        })
        .catch(() => setLocations([]));
    }, [lockedId])
  );

  const currentLoc = locations.find((l) => l.id === locationId) ?? null;

  // Reset the chosen item whenever the location changes (goods differ per point).
  useEffect(() => {
    setItem('');
  }, [locationId]);

  async function onSave() {
    setError(null);
    if (!session?.user) return;

    if (!locationId) {
      setError('Elige un punto de acopio.');
      return;
    }
    if (!item) {
      setError('Elige qué vas a donar.');
      return;
    }
    const qty = Number(quantity);
    if (!quantity || Number.isNaN(qty) || qty <= 0) {
      setError('Ingresa una cantidad válida.');
      return;
    }

    setSaving(true);
    try {
      await createDonation({
        donorId: session.user.id,
        locationId,
        kind: 'especie',
        items: item,
        quantity: qty,
      });
      Alert.alert(
        '¡Listo! 🎉',
        'Tu donación fue registrada y está pendiente de confirmación por un administrador.'
      );
      setItem('');
      setQuantity('');
      router.replace('/(app)/impact');
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo guardar la donación.');
    } finally {
      setSaving(false);
    }
  }

  async function onPayMoney() {
    setPayError(null);
    const amt = Number(money);
    if (!money || Number.isNaN(amt) || amt <= 0) {
      setPayError('Ingresa un monto válido.');
      return;
    }

    setPayState('processing');
    cancelPayRef.current = false;
    try {
      const sessionId = await startMoneyDonation(amt, locationId);
      // Poll until Stripe reports the session as paid (~60s max).
      for (let i = 0; i < 20 && !cancelPayRef.current; i++) {
        await sleep(3000);
        if (cancelPayRef.current) break;
        const status = await confirmMoneyDonation(sessionId);
        if (status === 'paid') {
          setPayState('idle');
          setMoney('');
          Alert.alert('¡Gracias! 💛', 'Tu donación en dinero fue recibida.');
          router.replace('/(app)/impact');
          return;
        }
      }
      if (!cancelPayRef.current) {
        setPayError(
          'Aún no detectamos el pago. Si ya pagaste, espera unos segundos e inténtalo de nuevo.'
        );
      }
    } catch (e: any) {
      setPayError(e?.message ?? 'No se pudo procesar el pago.');
    } finally {
      setPayState('idle');
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
          <Pressable
            onPress={() => setKind('especie')}
            style={[styles.segmentBtn, kind === 'especie' && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, kind === 'especie' && styles.segmentTextActive]}>
              📦 En especie
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setKind('dinero')}
            style={[styles.segmentBtn, kind === 'dinero' && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, kind === 'dinero' && styles.segmentTextActive]}>
              💵 Dinero
            </Text>
          </Pressable>
        </View>

        {kind === 'dinero' ? (
          // Money donation via Stripe Checkout.
          <View>
            <Field
              label="Monto (MXN)"
              placeholder="200"
              keyboardType="numeric"
              value={money}
              onChangeText={setMoney}
              editable={payState === 'idle'}
            />

            {payState === 'processing' ? (
              <View style={styles.processing}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.processingText}>
                  Esperando la confirmación del pago…{'\n'}
                  Completa el pago en la ventana de Stripe.
                </Text>
                <Pressable
                  onPress={() => {
                    cancelPayRef.current = true;
                    setPayState('idle');
                  }}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {payError && <Text style={styles.error}>{payError}</Text>}
                <PrimaryButton
                  label={money ? `Pagar $${money} con Stripe` : 'Pagar con Stripe'}
                  onPress={onPayMoney}
                />
                <Text style={styles.stripeNote}>Pago seguro con Stripe.</Text>
              </>
            )}
          </View>
        ) : (
          <>
            {/* Location: locked when arriving from "Donar aquí", else a picker */}
            <Text style={styles.label}>Punto de acopio</Text>
            {lockedId ? (
              <View style={styles.lockedLoc}>
                <Text style={styles.lockedName}>{currentLoc?.name ?? 'Punto seleccionado'}</Text>
                {!!currentLoc?.address && (
                  <Text style={styles.lockedAddr}>📍 {currentLoc.address}</Text>
                )}
              </View>
            ) : (
              <View style={{ marginBottom: spacing.lg }}>
                {locations.length === 0 ? (
                  <Text style={styles.muted}>Cargando puntos de acopio…</Text>
                ) : (
                  locations.map((loc) => {
                    const active = locationId === loc.id;
                    return (
                      <Pressable
                        key={loc.id}
                        onPress={() => setLocationId(loc.id)}
                        style={[styles.locOption, active && styles.locOptionActive]}
                      >
                        <Text style={[styles.locName, active && { color: colors.primary }]}>
                          {loc.name}
                        </Text>
                        {loc.needed_goods.length > 0 && (
                          <Text style={styles.locNeeds}>
                            Necesita: {loc.needed_goods.join(', ')}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

            {/* Items: dropdown of this point's accepted goods */}
            {currentLoc && currentLoc.accepted_goods.length > 0 ? (
              <Dropdown
                label="¿Qué vas a donar?"
                placeholder="Selecciona un producto"
                options={currentLoc.accepted_goods}
                value={item}
                onChange={setItem}
              />
            ) : (
              <Field
                label="¿Qué vas a donar?"
                placeholder="Ej. Arroz, frijol, leche..."
                value={item}
                onChangeText={setItem}
              />
            )}

            <Field
              label="Cantidad (unidades)"
              placeholder="10"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton label="Confirmar donación" onPress={onSave} loading={saving} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Lightweight cross-platform dropdown (no extra deps).
function Dropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.dropdown} onPress={() => setOpen((o) => !o)}>
        <Text style={[styles.dropdownText, !value && { color: colors.textMuted }]}>
          {value || placeholder}
        </Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={styles.dropdownMenu}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              style={styles.dropdownItem}
              onPress={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  value === opt && { color: colors.primary, fontWeight: '800' },
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  muted: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  segment: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
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
  segmentBtnActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  segmentText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  segmentTextActive: { color: colors.primary },
  lockedLoc: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  lockedName: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  lockedAddr: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  locOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  locOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  locName: { fontSize: 14, fontWeight: '700', color: colors.text },
  locNeeds: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 15, color: colors.text },
  chevron: { fontSize: 12, color: colors.textMuted },
  dropdownMenu: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownItemText: { fontSize: 15, color: colors.text },
  error: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  stripeNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  processing: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  processingText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
