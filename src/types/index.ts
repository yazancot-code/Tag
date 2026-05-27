export interface Article {
  id: string;
  nfc_uid: string | null;
  barcode: string | null;
  name_he: string;
  name_en: string | null;
  category: string | null;
  image_url: string | null;
  unit: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  household_id: string;
  article_id: string;
  quantity: number;
  added_by: string;
  added_at: string;
  checked: boolean;
  article?: Article;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  preferred_chain?: string | null;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export interface GovPrice {
  id: string;
  barcode: string;
  chain_id: string | null;
  chain_name: string | null;
  price: number | null;
  unit_qty: number | null;
  unit_type: string | null;
  fetched_at: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Settings: undefined;
};