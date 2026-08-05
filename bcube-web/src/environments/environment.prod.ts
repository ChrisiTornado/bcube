// Relative, same-origin paths: nginx.conf reverse-proxies /api/ to the api-gateway
// internally, so the browser never needs to reach a docker-internal hostname directly.
export const environment = {
  production: true,
  adminApiUrl: '/api/admin/users',
  userApiUrl: '/api/users',
  authUrl: '/api/auth',
  oauthGoogleUrl: '/oauth2/authorization/google',
  bookingApiUrl: '/api/bookings',
  studioApiUrl: '/api/studios',
  adminStudioApiUrl: '/api/admin/studios',
  accessApiUrl: '/api/access',
  paymentApiUrl: '/api/payments',
  stripePublishableKey: 'pk_test_51TC7bzINqnYv2UrCde3ZXJ03gGvLTBhcCNieTaMbj8LONkj6RZEpKPcnp19jr3rwJHmFDP7Y1FpwUsiiEedCBigg00Db7iPe7B',
  token: 'pk.eyJ1IjoiY2hyaXNpdG9ybmFkbyIsImEiOiJjbWR5dnppNmQwNmQwMmpzZW0ydGh1YmM5In0.n7q9PynonBYiRRqMuoM9lA'
};
