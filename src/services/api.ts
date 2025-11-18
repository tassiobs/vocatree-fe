import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthSignInRequest,
  AuthToken,
  AuthUpdatePasswordRequest,
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
        // Log request details for debugging
        if (config.method?.toUpperCase() === 'POST' && config.url?.includes('/cards/')) {
          console.log('POST /cards/ request:', {
            url: `${this.baseURL}${config.url}`,
            method: config.method,
            headers: config.headers,
            data: config.data,
            hasToken: !!token,
          });
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
        
        // Handle CORS errors
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          const corsError = new Error(
            'CORS Error: The API server is not allowing requests from this origin. ' +
            'Please ensure the backend CORS configuration includes: https://vocatree-fe.vercel.app'
          );
          corsError.name = 'CORSError';
          console.error('CORS Error Details:', {
            frontendOrigin: window.location.origin,
            apiUrl: this.baseURL,
            error: error.message
          });
          return Promise.reject(corsError);
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

  async updatePassword(passwordData: AuthUpdatePasswordRequest): Promise<void> {
    await this.client.put('/auth/update-password', passwordData);
  }

  // Cards
  async createCard(card: CardCreate): Promise<Card> {
    try {
      const response: AxiosResponse<Card> = await this.client.post('/cards/', card);
      return response.data;
    } catch (error: any) {
      // Log detailed error information for debugging
      console.error('createCard error details:', {
        url: `${this.baseURL}/cards/`,
        method: 'POST',
        data: card,
        errorCode: error.code,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        requestHeaders: error.config?.headers,
      });
      throw error;
    }
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
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`[${callId}] API: DELETE /cards/${id}`);
    try {
      await this.client.delete(`/cards/${id}`);
      console.log(`[${callId}] API: Successfully deleted card ${id}`);
    } catch (error: any) {
      console.error(`[${callId}] API: Failed to delete card ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  async deleteCardBulk(id: number): Promise<void> {
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`[${callId}] API: DELETE /cards/${id}/bulk`);
    try {
      await this.client.delete(`/cards/${id}/bulk`);
      console.log(`[${callId}] API: Successfully bulk deleted card ${id}`);
    } catch (error: any) {
      console.error(`[${callId}] API: Failed to bulk delete card ${id}:`, error.response?.data || error.message);
      throw error;
    }
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

  async bulkDeleteCategory(id: number): Promise<void> {
    console.log(`API: POST /categories/bulk-delete with category_id: ${id}`);
    try {
      await this.client.post(`/categories/bulk-delete`, { category_id: id });
      console.log(`API: Successfully bulk deleted category ${id}`);
    } catch (error: any) {
      console.error(`API: Failed to bulk delete category ${id}:`, error.response?.data || error.message);
      throw error;
    }
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
