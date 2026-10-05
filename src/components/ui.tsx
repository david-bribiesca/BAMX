// Small shared UI kit reused across BAMX screens (buttons, inputs, chips).
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, radius, spacing, statusMeta } from '@/theme';

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}) {
  const isOutline = variant === 'outline';
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        isOutline ? styles.btnOutline : styles.btnPrimary,
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.btnText, isOutline && { color: colors.primary }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function StatusChip({ status }: { status: string }) {
  const meta = statusMeta[status] ?? { label: status, color: colors.pending };
  return (
    <View style={[styles.chip, { backgroundColor: meta.color + '22' }]}>
      <View style={[styles.dot, { backgroundColor: meta.color }]} />
      <Text style={[styles.chipText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnOutline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  chipText: { fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
});
