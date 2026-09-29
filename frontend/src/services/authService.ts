export interface FarmerUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  farmer: FarmerUser;
}

const TOKEN_KEY = 'agroscale_farmer_token';
const USER_KEY = 'agroscale_farmer_user';

function isJwtExpired(token: string): boolean {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return true;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed && typeof parsed.exp === 'number') {
      return Date.now() >= parsed.exp * 1000;
    }
    return false;
  } catch {
    return true;
  }
}

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser(): FarmerUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clearLocalSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  handleUnauthorized() {
    this.clearLocalSession();
    window.dispatchEvent(new Event('auth:unauthorized'));
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (isJwtExpired(token)) {
      this.clearLocalSession();
      return false;
    }
    return true;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data: any = null;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMsg = data?.error?.message || (response.status === 401 ? 'Invalid email address or password.' : 'Unable to connect to login server.');
        throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Login failed.');
      }

      if (!data || !data.token || !data.farmer) {
        throw new Error('Server returned invalid authentication response.');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.farmer));

      return data;
    } catch (err: any) {
      throw err;
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    try {
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.warn('Backend logout call failed:', err);
    } finally {
      this.clearLocalSession();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated. Please log in first.');
    }

    const response = await fetch('/api/v1/auth/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    if (response.status === 401) {
      this.handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    let data: any = null;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMsg = data?.error?.message || 'Password update failed.';
      throw new Error(typeof errorMsg === 'string' ? errorMsg : 'Password update failed.');
    }
  }
};

