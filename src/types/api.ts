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

export interface AuthUpdatePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface AuthMeResponse {
  id: number;
  email: string;
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
  ipa?: string | null;
  register?: string | null;
  difficulty?: string | null;
  etymology?: string | null;
  mastery_level?: string | null;
  last_reviewed_at?: string | null;
  review_count?: number;
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
  ipa?: string | null;
  register?: string | null;
  difficulty?: string | null;
  etymology?: string | null;
  mastery_level?: string | null;
  notes?: string | null;
  last_reviewed_at?: string | null;
  review_count?: number | null;
}

export interface CardAIEnrichRequest {
  language: string;
  prompt?: string;
}

export interface CardListResponse {
  total: number;
  limit: number;
  offset: number;
  items: Card[];
}

export interface ReviewedCard {
  id: number;
  name: string;
  created_at: string;
  parent_id: number | null;
  parent_name: string | null;
  category_id: number | null;
  category_name: string | null;
  is_folder: boolean;
  last_reviewed_at: string;
  next_review_at: string | null;
  review_count: number;
  mastery_level: string;
}

export interface ReviewedCardsResponse {
  total: number;
  limit: number;
  offset: number;
  items: ReviewedCard[];
}

export interface MoveCardRequest {
  parent_id?: number | null;
  category_id?: number | null;
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

export interface CategoryUpdate {
  name?: string;
}

export interface CategoryWithCardsResponse {
  category: Category | null;
  cards: Card[];
}

export interface EvaluateMeaningRequest {
  word: string;
  user_meaning: string;
  language: string;
  prompt?: string;
}

export interface EvaluateMeaningResponse {
  evaluation: string;
  refined_meaning: string;
}

export interface EvaluateExamplePhraseRequest {
  word: string;
  example_phrase: string;
  language: string;
  prompt?: string;
  previous_phrases?: string[];
  previous_refined_phrases?: string[];
}

export interface GrammarAnalysis {
  has_errors: boolean;
  errors: string[] | null;
}

export type NaturalnessLevel = 'unnatural' | 'understandable_but_unnatural' | 'natural' | 'native_like';

export type ToneLevel = 'formal' | 'neutral' | 'informal';

export interface EvaluateExamplePhraseResponse {
  grammar: GrammarAnalysis;
  naturalness: NaturalnessLevel;
  tone: ToneLevel;
  alternative_phrase: string;
}

export interface CardReviewRequest {
  last_reviewed_at: string;
  review_count: number;
}

export interface CardReviewResponse {
  id: number;
  card_id: number;
  user_id: number;
  mastery_level: string;
  last_reviewed_at: string;
  next_review_at: string;
  review_count: number;
  used_in_writing_count: number;
  used_in_speaking_count: number;
  last_used_in_writing_at: string;
  last_used_in_speaking_at: string;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface Instance {
  id: number;
  name: string;
  description: string | null;
  workplace_id: number;
  created_by: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstanceWithRole {
  instance: Instance;
  user_role: string;
}

export interface InstanceListResponse {
  items: InstanceWithRole[];
}

export interface CardReviewItem {
  id: number;
  card_id: number;
  user_id: number;
  mastery_level: string;
  last_reviewed_at: string;
  next_review_at: string;
  review_count: number;
  used_in_writing_count: number;
  used_in_speaking_count: number;
  last_used_in_writing_at: string;
  last_used_in_speaking_at: string;
  use_count: number;
  created_at: string;
  updated_at: string;
  card_name: string;
  card_category_id: number;
  card_category_name: string;
  parent_id: number;
  parent_name: string;
  is_folder: boolean;
}

export interface CardReviewsResponse {
  total: number;
  limit: number;
  offset: number;
  items: CardReviewItem[];
}

export interface Workplace {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface WorkplaceWithRole {
  workplace: Workplace;
  user_role: 'owner' | 'admin' | 'member';
}

export interface WorkplaceListResponse {
  items: WorkplaceWithRole[];
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  workplace_id: number;
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// Note: ApiResponse and ApiError types are defined here for future use
// but are not currently used in the implementation
