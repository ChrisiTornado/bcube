// Template only - lists every variable the frontend reads. Copy to environment.ts (git-ignored)
// and fill in the values:
//   cp src/environments/environment.example.ts src/environments/environment.ts
//
// API paths are relative/same-origin (e.g. '/api/auth'): nginx.conf (docker) and proxy.conf.json
// (ng serve) forward /api, /oauth2 and /login/ to the api-gateway.
export const environment = {
  adminApiUrl: '',            // e.g. '/api/admin/users'
  userApiUrl: '',             // e.g. '/api/users'
  authUrl: '',                // e.g. '/api/auth'
  oauthGoogleUrl: '',         // e.g. '/oauth2/authorization/google'
  bookingApiUrl: '',          // e.g. '/api/bookings'
  studioApiUrl: '',           // e.g. '/api/studios'
  adminStudioApiUrl: '',      // e.g. '/api/admin/studios'
  accessApiUrl: '',           // e.g. '/api/access'
  paymentApiUrl: '',          // e.g. '/api/payments'
  stripePublishableKey: '',   // Stripe publishable key (pk_test_... / pk_live_...)
  token: ''                   // Mapbox public access token (pk.ey...)
};
