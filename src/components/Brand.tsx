// BAMX wordmark used on the auth screens (matches mockup p.1).
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

export function Brand({ tagline = true }: { tagline?: boolean }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.logoRow}>
        <View style={styles.mark}>
          <Text style={styles.markEmoji}>🍎</Text>
        </View>
        <View>
          <Text style={styles.name}>BAMX</Text>
          <Text style={styles.city}>GUADALAJARA</Text>
        </View>
      </View>
      {tagline && (
        <Text style={styles.tagline}>Juntos hacemos la diferencia 🤝</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  mark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  markEmoji: { fontSize: 22 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 26 },
  city: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.white,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
    marginTop: 2,
  },
  tagline: { marginTop: 10, color: colors.textMuted, fontSize: 13 },
});
