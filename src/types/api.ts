// Generated types from OpenAPI specification

export interface AuthSignInRequest {
  email: string;
  password: string;
}

export interface AuthSignUpRequest {
  email: string;
  password: string;
}

export interface AuthSignUpResponse {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface Card {
  id: number;
  name: string;
  parent_id: number | null;
  is_folder: boolean;
  category_id?: number | null;
  example_phrases: string[] | null;
  meanings: string[] | null;
  grammar_roles: string[] | null;
  collocations: string[] | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  related_words: string[] | null;
  word_forms: string[] | null;
  videos: string[] | null;
  use_count: number;
  notes: string | null;
  created_at: string;
  user_created: number;
  children: Card[] | null;
}

export interface CardCreate {
  name: string;
  parent_id?: number | null;
  is_folder?: boolean;
  category_id?: number;
  example_phrases?: string[] | null;
  meanings?: string[] | null;
  grammar_roles?: string[] | null;
  collocations?: string[] | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  use_count?: number;
  notes?: string | null;
}

export interface CardUpdate {
  name?: string | null;
  parent_id?: number | null;
  example_phrases?: string[] | null;
  meanings?: string[] | null;
  grammar_roles?: string[] | null;
  collocations?: string[] | null;
  synonyms?: string[] | null;
  antonyms?: string[] | null;
  related_words?: string[] | null;
  word_forms?: string[] | null;
  videos?: string[] | null;
  use_count?: number | null;
  notes?: string | null;
}

export interface CardListResponse {
  total: number;
  limit: number;
  offset: number;
  items: Card[];
}

export interface MoveCardRequest {
  new_parent_id: number | null;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
  user_created: number;
  is_default?: boolean;
}

export interface CategoryListResponse {
  total: number;
  limit: number;
  offset: number;
  items: Category[];
}

// Note: ApiResponse and ApiError types are defined here for future use
// but are not currently used in the implementation
