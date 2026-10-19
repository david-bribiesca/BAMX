// Data-access layer. All Supabase table queries live here so screens stay
// focused on UI (see AGENTS.md: "Keep DB queries in separate files").
import { supabase } from './supabase';

export type DonationStatus = 'pendiente' | 'en_camino' | 'entregada';

// A drop-off point ("punto de acopio"): what it accepts and what it needs now.
export type Location = {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  accepted_goods: string[];
  needed_goods: string[];
};

export type Donation = {
  id: string;
  donor_id: string;
  location_id: string | null;
  kind: 'especie' | 'dinero';
  items: string;
  quantity: number;
  status: DonationStatus;
  created_at: string;
  // Joined location name (from the select below).
  locations?: { name: string } | null;
};

// READ: active drop-off locations for the map.
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, address, lat, lng, accepted_goods, needed_goods')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Location[];
}

// READ: the signed-in donor's own donations. RLS returns only their rows.
export async function getMyDonations(userId: string): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select(
      'id, donor_id, location_id, kind, items, quantity, status, created_at, locations(name)'
    )
    .eq('donor_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Donation[];
}

export type NewDonation = {
  donorId: string;
  locationId: string | null;
  kind: 'especie' | 'dinero';
  items: string;
  quantity: number;
};

// SAVE: create a new in-kind donation.
export async function createDonation(input: NewDonation): Promise<Donation> {
  const { data, error } = await supabase
    .from('donations')
    .insert({
      donor_id: input.donorId,
      location_id: input.locationId,
      kind: input.kind,
      items: input.items,
      quantity: input.quantity,
      status: 'pendiente',
    })
    .select(
      'id, donor_id, location_id, kind, items, quantity, status, created_at, locations(name)'
    )
    .single();

  if (error) throw error;
  return data as unknown as Donation;
}
