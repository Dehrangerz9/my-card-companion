// Simple in-memory mock auth for demo purposes
let isAuthenticated = false;

export function login(email: string, password: string): boolean {
  // Mock: accept any non-empty credentials
  if (email && password) {
    isAuthenticated = true;
    if (typeof window !== "undefined") {
      sessionStorage.setItem("cc_auth", "true");
    }
    return true;
  }
  return false;
}

export function logout() {
  isAuthenticated = false;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("cc_auth");
  }
}

export function checkAuth(): boolean {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("cc_auth") === "true";
  }
  return isAuthenticated;
}
