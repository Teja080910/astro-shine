export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
  socketPath: process.env.EXPO_PUBLIC_SOCKET_PATH || '/ws',
  agoraAppId: process.env.EXPO_PUBLIC_AGORA_APP_ID || '',
  get apiBaseUrl() {
    if (!this.apiUrl) throw new Error('EXPO_PUBLIC_API_URL is not set');
    return `${this.apiUrl}/api/v1`;
  },
  get socketUrl() { return this.apiUrl; },
};
