// Data-access layer. All Supabase table queries live here so screens stay
// focused on UI (see AGENTS.md: "Keep DB queries in separate files").
import { supabase } from './supabase';

export type Campaign = {
  id: string;
  name: string;
  description: string | null;
  location_name: string | null;
  goal_meals: number | null;
};

export type DonationStatus = 'pendiente' | 'en_camino' | 'entregada';

export type Donation = {
  id: string;
  donor_id: string;
  campaign_id: string | null;
  kind: 'especie' | 'dinero';
  items: string;
  quantity: number;
  status: DonationStatus;
  created_at: string;
  // Joined campaign name (from the select below).
  campaigns?: { name: string } | null;
};

// READ: active campaigns shown on the donor home ("Campañas activas").
export async function getActiveCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, description, location_name, goal_meals')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Campaign[];
}

// READ: the signed-in donor's own donations ("Mis donaciones").
// RLS ensures only their rows come back.
export async function getMyDonations(userId: string): Promise<Donation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select(
      'id, donor_id, campaign_id, kind, items, quantity, status, created_at, campaigns(name)'
    )
    .eq('donor_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Donation[];
}

export type NewDonation = {
  donorId: string;
  campaignId: string | null;
  kind: 'especie' | 'dinero';
  items: string;
  quantity: number;
};

// SAVE: create a new donation ("Nueva Donación").
export async function createDonation(input: NewDonation): Promise<Donation> {
  const { data, error } = await supabase
    .from('donations')
    .insert({
      donor_id: input.donorId,
      campaign_id: input.campaignId,
      kind: input.kind,
      items: input.items,
      quantity: input.quantity,
      status: 'pendiente',
    })
    .select(
      'id, donor_id, campaign_id, kind, items, quantity, status, created_at, campaigns(name)'
    )
    .single();

  if (error) throw error;
  return data as unknown as Donation;
}
