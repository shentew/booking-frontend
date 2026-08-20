   const API_URL = 'https://booking-system-backend-bgvo.onrender.com';

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Verificar si la respuesta es HTML (error)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('El backend no está respondiendo. ¿Está encendido en el puerto 3001?');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    
    return data;
  }

  async getServices() {
    return this.request('/api/v1/services');
  }

  async getAvailability(staffId: string, serviceId: string, date: string) {
    return this.request(`/api/v1/appointments/availability?staffId=${staffId}&serviceId=${serviceId}&date=${date}`);
  }

  async createAppointment(staffId: string, serviceId: string, startTime: string) {
    return this.request('/api/v1/appointments', {
      method: 'POST',
      body: JSON.stringify({ staffId, serviceId, startTime }),
    });
  }
}

export const api = new ApiClient();