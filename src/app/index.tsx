// Entry route — the root layout's redirect logic sends the user to the right
// place, so this just shows a spinner while that resolves.
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/theme';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
