import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthSignInRequest,
  AuthToken,
  Card,
  CardCreate,
  CardUpdate,
  CardListResponse,
  Category,
  CategoryListResponse
} from '../types/api';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async signIn(credentials: AuthSignInRequest): Promise<AuthToken> {
    const response: AxiosResponse<AuthToken> = await this.client.post('/auth/signin', credentials);
    return response.data;
  }

  // Cards
  async createCard(card: CardCreate): Promise<Card> {
    const response: AxiosResponse<Card> = await this.client.post('/cards/', card);
    return response.data;
  }

  async getCards(params?: {
    parent_id?: number | null;
    limit?: number;
    offset?: number;
  }): Promise<CardListResponse> {
    const response: AxiosResponse<CardListResponse> = await this.client.get('/cards/', { params });
    return response.data;
  }

  async getCard(id: number): Promise<Card> {
    const response: AxiosResponse<Card> = await this.client.get(`/cards/${id}`);
    return response.data;
  }

  async updateCard(id: number, card: CardUpdate): Promise<Card> {
    const response: AxiosResponse<Card> = await this.client.patch(`/cards/${id}`, card);
    return response.data;
  }

  async deleteCard(id: number): Promise<void> {
    await this.client.delete(`/cards/${id}`);
  }

  async deleteCardBulk(id: number): Promise<void> {
    await this.client.delete(`/cards/${id}/bulk`);
  }

  async moveCard(id: number, newParentId: number | null): Promise<void> {
    await this.client.patch(`/cards/${id}/move`, { new_parent_id: newParentId });
  }

  async getCardsByParent(parentId: number, params?: {
    limit?: number;
    offset?: number;
  }): Promise<CardListResponse> {
    const response: AxiosResponse<CardListResponse> = await this.client.get(
      `/cards/by-parent/${parentId}`,
      { params }
    );
    return response.data;
  }

  async getCardsHierarchy(categoryId?: number): Promise<Card[]> {
    const params = categoryId ? { category_id: categoryId } : {};
    const response: AxiosResponse<Card[]> = await this.client.get('/cards/hierarchy', { params });
    return response.data;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response: AxiosResponse<CategoryListResponse> = await this.client.get('/categories/');
    return response.data.items;
  }

  async createCategory(name: string): Promise<Category> {
    const response: AxiosResponse<Category> = await this.client.post('/categories/', { name });
    return response.data;
  }

  async generateAITree(data: {
    language: string;
    category_name: string;
    prompt?: string;
  }): Promise<any> {
    const response: AxiosResponse<any> = await this.client.post('/categories/ai-generate-tree', data);
    return response.data;
  }

  // Utility method to set auth token
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  // Utility method to remove auth token
  removeAuthToken(): void {
    localStorage.removeItem('auth_token');
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

export const apiClient = new ApiClient();
export default apiClient;
