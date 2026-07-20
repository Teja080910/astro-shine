export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.229.125.238:3067',
  socketPath: process.env.EXPO_PUBLIC_SOCKET_PATH || '/ws',
  get apiBaseUrl() { return `${this.apiUrl}/api/v1`; },
  get socketUrl() { return this.apiUrl; },
};
