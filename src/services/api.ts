import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  AuthSignInRequest,
  AuthToken,
  AuthUpdatePasswordRequest,
  AuthMeResponse,
  Card,
  CardCreate,
  CardUpdate,
  CardAIEnrichRequest,
  CardListResponse,
  Category,
  CategoryListResponse,
  CategoryUpdate,
  CategoryWithCardsResponse,
  ReviewedCardsResponse,
  EvaluateMeaningRequest,
  EvaluateMeaningResponse,
  EvaluateExamplePhraseRequest,
  EvaluateExamplePhraseResponse,
  CardReviewRequest,
  CardReviewResponse,
  InstanceListResponse,
  CardReviewsResponse
} from '../types/api';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private onAuthFailure?: () => void;

  setOnAuthFailure(callback: () => void) {
    this.onAuthFailure = callback;
  }

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'https://web-production-89a2.up.railway.app/') {
    const sanitizedEnv = process.env.REACT_APP_API_URL?.trim();
    const deprecatedHosts = ['https://vocatree-production-17ae.up.railway.app', 'https://vocatree-production-17ae.up.railway.app/'];
    if (sanitizedEnv && deprecatedHosts.includes(sanitizedEnv)) {
      console.warn('Detected deprecated REACT_APP_API_URL value, overriding to new production host.');
      baseURL = 'https://web-production-89a2.up.railway.app/';
    }
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      console.log('ApiClient baseURL resolved:', {
        envValue: process.env.REACT_APP_API_URL,
        finalBaseURL: this.baseURL,
      });
    }
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // REQUIRED: Send cookies with all requests (cross-origin)
      xsrfCookieName: undefined, // Disable CSRF token handling - not needed for our use case
      xsrfHeaderName: undefined,
    });

    // Request interceptor - ensure withCredentials is always true
    this.client.interceptors.request.use(
      (config) => {
        // CRITICAL: Ensure withCredentials is always set to true for cookie-based auth
        // This is required for cross-origin cookie support
        config.withCredentials = true;
        
        // Log if withCredentials somehow got disabled
        if (!config.withCredentials) {
          console.error('⚠️ WARNING: withCredentials was false! Forcing to true.');
        }
        
        // Log auth-related requests for debugging
        if (config.url?.includes('/auth/')) {
          console.log('🔐 Auth request:', {
            url: `${this.baseURL}${config.url}`,
            method: config.method?.toUpperCase(),
            withCredentials: config.withCredentials,
            headers: Object.keys(config.headers || {}),
            // Note: HttpOnly cookies won't appear in document.cookie, but should be sent automatically
            note: 'HttpOnly cookies are sent automatically if withCredentials is true',
          });
        }
        
        // Log request details for debugging
        if (config.method?.toUpperCase() === 'POST' && config.url?.includes('/cards/')) {
          console.log('POST /cards/ request:', {
            url: `${this.baseURL}${config.url}`,
            method: config.method,
            headers: config.headers,
            data: config.data,
            withCredentials: config.withCredentials,
          });
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for 401 handling with refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');

        // Handle 401 Unauthorized (but skip refresh for auth endpoints to avoid loops)
        // Also skip if the request is to /auth/signin - let it fail normally with the error message
        const isSignInEndpoint = originalRequest.url?.includes('/auth/signin');
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isSignInEndpoint) {
          // If we're already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Attempt to refresh the token using fetch to ensure credentials are included
            // Use fetch directly for refresh to avoid axios interceptor loops
            const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (!refreshResponse.ok) {
              throw new Error(`Refresh failed with status ${refreshResponse.status}`);
            }
            
            // Process queued requests
            this.failedQueue.forEach((prom) => prom.resolve());
            this.failedQueue = [];
            
            // Retry the original request with withCredentials ensured
            originalRequest.withCredentials = true;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - clear queue and reject
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];
            
            // Notify auth context about auth failure
            if (this.onAuthFailure) {
              this.onAuthFailure();
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle network vs CORS errors so offline issues don't show generic CORS message
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          const isBrowser = typeof window !== 'undefined';
          const isOffline = isBrowser && typeof navigator !== 'undefined' && navigator.onLine === false;
          const looksLikeCors =
            !isOffline &&
            !error.response &&
            error.request &&
            (error.request.status === 0 || error.request.readyState === 4);

          if (isOffline) {
            const offlineError = new Error(
              'Network Error: Unable to reach the API. Please check your internet connection or whether the server is down.'
            );
            offlineError.name = 'NetworkOfflineError';
            return Promise.reject(offlineError);
          }

          if (looksLikeCors) {
            const frontendOrigin = isBrowser ? window.location.origin : 'unknown';
            const corsError = new Error(
              'CORS Error: The API server is not allowing requests from this origin. ' +
              `Please ensure the backend CORS configuration includes: ${frontendOrigin}`
            );
            corsError.name = 'CORSError';
            console.error('CORS Error Details:', {
              frontendOrigin,
              apiUrl: this.baseURL,
              error: error.message
            });
            return Promise.reject(corsError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async signIn(credentials: AuthSignInRequest): Promise<any> {
    // Log the request for debugging
    console.log('Signing in with credentials:', {
      email: credentials.email,
      passwordLength: credentials.password?.length,
      emailTrimmed: credentials.email?.trim(),
      passwordTrimmed: credentials.password?.trim()?.length,
    });
    
    // Trim email and password to avoid whitespace issues
    const trimmedCredentials: AuthSignInRequest = {
      email: credentials.email.trim(),
      password: credentials.password.trim(),
    };
    
    try {
      // Cookies are set by the backend automatically
      console.log('Making signin request...', {
        url: `${this.baseURL}/auth/signin`,
        method: 'POST',
        withCredentials: true,
        data: {
          email: trimmedCredentials.email,
          passwordLength: trimmedCredentials.password.length,
        },
      });
      
      const response = await this.client.post('/auth/signin', trimmedCredentials);
      
      // Check for Set-Cookie headers (axios may not expose these directly)
      const setCookieHeaders = response.headers['set-cookie'];
      const hasSetCookieHeaders = !!setCookieHeaders && (Array.isArray(setCookieHeaders) ? setCookieHeaders.length > 0 : true);
      
      console.log('✅ Sign in response received:', {
        status: response.status,
        statusText: response.statusText,
        hasSetCookieHeaders: hasSetCookieHeaders,
        contentType: response.headers['content-type'],
      });
      
      // Check if Set-Cookie headers are present (note: axios may not expose Set-Cookie in headers)
      // Check browser DevTools Network tab → Response Headers to verify Set-Cookie headers
      console.log('📋 Next step: Check Network tab → /auth/signin → Response Headers → Set-Cookie');
      console.log('📋 Then check: Next request → Request Headers → Cookie: header should contain tokens');
      
      // Return response data in case it contains user info
      return response.data;
    } catch (error: any) {
      console.error('❌ Sign in error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          withCredentials: error.config?.withCredentials,
          data: {
            email: error.config?.data?.email,
            passwordLength: error.config?.data?.password?.length,
          },
          headers: error.config?.headers,
        },
        request: {
          responseURL: error.request?.responseURL,
          status: error.request?.status,
        },
      });
      throw error;
    }
  }

  async refresh(): Promise<void> {
    // Use fetch directly to ensure credentials are always included
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Refresh failed with status ${response.status}`);
    }
  }

  async getMe(): Promise<AuthMeResponse> {
    try {
      console.log('🔍 Getting user info from /auth/me...');
      const response: AxiosResponse<AuthMeResponse> = await this.client.get('/auth/me');
      console.log('✅ /auth/me successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ /auth/me failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      console.error('⚠️ Check Network tab → /auth/me request → Request Headers → Cookie: header');
      console.error('⚠️ If Cookie: header is missing, cookies are not being sent');
      throw error;
    }
  }

  async debugCookies(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await this.client.get('/auth/debug-cookies');
      return response.data;
    } catch (error: any) {
      console.error('Debug cookies error:', error);
      return { error: error.response?.data || error.message };
    }
  }

  async updatePassword(passwordData: AuthUpdatePasswordRequest): Promise<void> {
    await this.client.put('/auth/update-password', passwordData);
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error: any) {
      // Even if logout fails, we should clear local state
      console.warn('Logout endpoint failed:', error.message);
    }
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
    instance_id?: number;
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

  async aiEnrichCard(id: number, data: CardAIEnrichRequest): Promise<Card> {
    const response: AxiosResponse<Card> = await this.client.patch(`/cards/${id}/ai-enrich`, data);
    return response.data;
  }

  async createAICard(data: {
    name: string;
    language: string;
    prompt?: string;
    category_id?: number;
    parent_id?: number;
  }): Promise<Card> {
    const response: AxiosResponse<Card> = await this.client.post('/cards/ai-card', data);
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

  async moveCard(id: number, data: { parent_id?: number | null; category_id?: number | null }): Promise<void> {
    // Build request body - only include defined fields
    const requestBody: { parent_id?: number | null; category_id?: number | null } = {};
    
    if (data.parent_id !== undefined) {
      requestBody.parent_id = data.parent_id;
    }
    
    if (data.category_id !== undefined) {
      requestBody.category_id = data.category_id;
    }
    
    console.log(`Moving card ${id} with data:`, requestBody);
    await this.client.patch(`/cards/${id}/move`, requestBody);
  }

  async getCardsByParent(parentId: number, params?: {
    instance_id?: number;
    limit?: number;
    offset?: number;
  }): Promise<CardListResponse> {
    const response: AxiosResponse<CardListResponse> = await this.client.get(
      `/cards/by-parent/${parentId}`,
      { params }
    );
    return response.data;
  }

  async getCardsHierarchy(categoryId?: number, instanceId?: number): Promise<Card[]> {
    const params: { category_id?: number; instance_id?: number } = {};
    if (categoryId !== undefined) {
      params.category_id = categoryId;
    }
    if (instanceId !== undefined) {
      params.instance_id = instanceId;
    }
    const response: AxiosResponse<Card[]> = await this.client.get('/cards/hierarchy', { params });
    return response.data;
  }

  async getReviewedCards(days: number = 7): Promise<ReviewedCardsResponse> {
    const response: AxiosResponse<ReviewedCardsResponse> = await this.client.get('/cards/reviewed', { 
      params: { days } 
    });
    return response.data;
  }

  async getCardReview(cardId: number): Promise<CardReviewResponse | null> {
    try {
      const response: AxiosResponse<CardReviewResponse> = await this.client.get(`/cards/${cardId}/review`);
      return response.data;
    } catch (error: any) {
      // If 404, return null (no review record exists yet)
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async logCardReview(cardId: number, reviewData: CardReviewRequest): Promise<CardReviewResponse> {
    const response: AxiosResponse<CardReviewResponse> = await this.client.post(`/cards/${cardId}/review`, reviewData);
    return response.data;
  }

  async getInstances(): Promise<InstanceListResponse> {
    const response: AxiosResponse<InstanceListResponse> = await this.client.get('/instances/');
    return response.data;
  }

  async getCardReviews(instanceId?: number, days?: number): Promise<CardReviewsResponse> {
    const params: { instance_id?: number; days?: number } = {};
    if (instanceId !== undefined) {
      params.instance_id = instanceId;
    }
    if (days !== undefined) {
      params.days = days;
    }
    const response: AxiosResponse<CardReviewsResponse> = await this.client.get('/card-reviews', { params });
    return response.data;
  }

  // Categories
  async getCategories(instanceId?: number): Promise<Category[]> {
    const params = instanceId !== undefined ? { instance_id: instanceId } : {};
    const response: AxiosResponse<CategoryListResponse> = await this.client.get('/categories/', { params });
    return response.data.items;
  }

  async getCategoriesWithCards(instanceId?: number): Promise<CategoryWithCardsResponse[]> {
    const params = instanceId !== undefined ? { instance_id: instanceId } : {};
    const response: AxiosResponse<CategoryWithCardsResponse[]> = await this.client.get('/categories/with-cards', { params });
    return response.data;
  }

  async createCategory(name: string): Promise<Category> {
    const response: AxiosResponse<Category> = await this.client.post('/categories/', { name });
    return response.data;
  }

  async updateCategory(id: number, category: CategoryUpdate): Promise<Category> {
    const response: AxiosResponse<Category> = await this.client.patch(`/categories/${id}`, category);
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

  async evaluateMeaning(data: EvaluateMeaningRequest): Promise<EvaluateMeaningResponse> {
    const response: AxiosResponse<EvaluateMeaningResponse> = await this.client.post('/cards/evaluate-meaning', data);
    return response.data;
  }

  async evaluateExamplePhrase(data: EvaluateExamplePhraseRequest): Promise<EvaluateExamplePhraseResponse> {
    const response: AxiosResponse<EvaluateExamplePhraseResponse> = await this.client.post('/cards/evaluate-example-phrase', data);
    return response.data;
  }

  // No token storage methods needed - using HTTP-only cookies
}

export const apiClient = new ApiClient();
export default apiClient;
