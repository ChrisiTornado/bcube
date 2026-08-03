// Relative, same-origin paths: nginx.conf reverse-proxies /api/ to the api-gateway
// internally, so the browser never needs to reach a docker-internal hostname directly.
export const environment = {
  production: true,
  adminApiUrl: '/api/admin/users',
  userApiUrl: '/api/users',
  authUrl: '/api/auth',
  bookingApiUrl: '/api/bookings',
  studioApiUrl: '/api/studios',
  adminStudioApiUrl: '/api/admin/studios',
  accessApiUrl: '/api/access',
  token: 'YOUR_MAPBOX_TOKEN'
};
