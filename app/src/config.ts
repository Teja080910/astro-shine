export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.229.125.238:3067',
  socketPath: process.env.EXPO_PUBLIC_SOCKET_PATH || '/ws',
  agoraAppId: process.env.EXPO_PUBLIC_AGORA_APP_ID || 'ee9a59789de0470ca4fdcb443f68c1cc',
  get apiBaseUrl() { return `${this.apiUrl}/api/v1`; },
  get socketUrl() { return this.apiUrl; },
};
