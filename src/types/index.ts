export interface Tag {
  id: string;
  content: string;
  tag_type: string;
  scanned_at: string;
  quantity: number;
}

export type RootStackParamList = {
  Home: undefined;
};