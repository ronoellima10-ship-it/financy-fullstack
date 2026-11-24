const TOKEN_KEY = "financy:token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(token: string, remember: boolean) {
  clearAuthToken();
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function hasAuthToken() {
  return Boolean(getAuthToken());
}
