export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3067',
  get apiBaseUrl() { return `${this.apiUrl}/api/v1`; },
};
