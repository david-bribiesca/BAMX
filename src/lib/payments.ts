import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

export async function startMoneyDonation(
  amount: number,
  locationId: string | null
): Promise<string> {
  const successUrl =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? `${window.location.origin}?paid=1`
      : undefined;

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { amount, locationId, successUrl },
  });
  if (error) throw new Error(error.message);
  if (!data?.url) throw new Error(data?.error ?? 'No se pudo iniciar el pago.');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(data.url, '_blank');
  } else {
    await WebBrowser.openBrowserAsync(data.url as string);
  }
  return data.id as string;
}

export async function confirmMoneyDonation(sessionId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('confirm-donation', {
    body: { sessionId },
  });
  if (error) throw new Error(error.message);
  return (data?.status ?? 'pending') as string;
}
