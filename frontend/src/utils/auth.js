class AuthService {
  static getToken() {
    return localStorage.getItem('authToken');
  }

  static setToken(token) {
    localStorage.setItem('authToken', token);
  }

  static removeToken() {
    localStorage.removeItem('authToken');
  }

  static getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static setStoredUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  static removeStoredUser() {
    localStorage.removeItem('user');
  }

  static isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    // Basic token expiration check (you might want to use jwt-decode for proper check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  static logout() {
    this.removeToken();
    this.removeStoredUser();
    window.location.href = '/login';
  }
}

export default AuthService;