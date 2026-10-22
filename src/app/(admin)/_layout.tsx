// Admin app: a single screen to approve pending donations per drop-off point.
import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

export default function AdminLayout() {
  const { signOut } = useAuth();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '800' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Administración',
          headerRight: () => (
            <Text
              onPress={signOut}
              style={{ color: colors.white, fontWeight: '700', paddingHorizontal: 12 }}
            >
              Salir
            </Text>
          ),
        }}
      />
    </Stack>
  );
}
