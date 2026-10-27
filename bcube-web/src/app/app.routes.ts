import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';
import { profileCompleteGuard } from '@core/guards/profile-complete.guard';
import { guestOrUserGuard } from '@core/guards/guest-or-user.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('@features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('@features/auth/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'legal',
        loadComponent: () => import('@features/legal/legal.component').then(m => m.LegalComponent)
    },

    {
        path: 'auth',
        children: [
            {
                path: 'change-password',
                loadComponent: () => import('@features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent)
            },
            {
                path: 'email-reset',
                loadComponent: () => import('@features/auth/email-reset/email-reset.component').then(m => m.EmailResetComponent)
            },
            {
                path: 'enter-code',
                loadComponent: () => import('@features/auth/enter-code/enter-code.component').then(m => m.EnterCodeComponent)
            },
            {
                path: 'oauth-callback',
                loadComponent: () => import('@features/auth/oauth-callback/oauth-callback.component').then(m => m.OauthCallbackComponent)
            },
            {
                path: 'complete-profile',
                loadComponent: () => import('@features/auth/complete-profile-page/complete-profile-page.component').then(m => m.CompleteProfilePageComponent)
            },
        ]
    },

    {
        path: 'admin-dashboard',
        loadComponent: () => import('@app/layout/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
        canActivate: [authGuard, profileCompleteGuard, roleGuard],
        data: { expectedRole: 'ADMIN' },
        children: [
            { path: '', redirectTo: 'studios', pathMatch: 'full' },
            {
                path: 'studios',
                loadComponent: () => import('@features/studios/studios-view/studios-view.component').then(m => m.StudiosViewComponent)
            },
            {
                path: 'users',
                loadComponent: () => import('@features/users/users-view/users-view.component').then(m => m.UsersViewComponent)
            },
            {
                path: 'bookings',
                loadComponent: () => import('@features/bookings/bookings-view/bookings-view.component').then(m => m.BookingsViewComponent)
            },
            {
                path: 'calendar',
                loadComponent: () => import('@features/bookings/calendar-view/calendar-view.component').then(m => m.CalendarViewComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('@features/profile/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
            },
            {
                path: 'studio-details/:id',
                loadComponent: () => import('@features/studios/studios-view/studio-details/studio-details.component').then(m => m.StudioDetailsComponent)
            },
            {
                path: 'booking-details/:id',
                loadComponent: () => import('@features/bookings/bookings-view/booking-details/booking-details.component').then(m => m.BookingDetailsComponent)
            },
            {
                path: 'payment-history',
                loadComponent: () => import('@features/payments/payment-history-view/payment-history-view.component').then(m => m.PaymentHistoryViewComponent)
            }
        ]
    },
    // Legacy prefix from before the user area moved to the app root - keeps old bookmarks and
    // already-sent e-mail links working: /user-dashboard/studio-details/4 -> /studio-details/4.
    {
        path: 'user-dashboard',
        children: [{
            path: '**',
            redirectTo: ({ url, queryParams, fragment }) =>
                inject(Router).createUrlTree(url.map(segment => segment.path), { queryParams, fragment: fragment ?? undefined })
        }]
    },

    // User area at the app root, which is also the public landing page: guests can browse cubes,
    // studio details and the calendar tab (which then prompt them to sign in); everything tied
    // to a personal account keeps authGuard. Must stay after every other top-level path.
    {
        path: '',
        loadComponent: () => import('@app/layout/user-shell/user-shell.component').then(m => m.UserShellComponent),
        canActivate: [guestOrUserGuard],
        children: [
            { path: '', redirectTo: 'studios', pathMatch: 'full' },
            {
                path: 'studios',
                loadComponent: () => import('@features/studios/studios-view/studios-view.component').then(m => m.StudiosViewComponent)
            },
            {
                path: 'my-cube',
                loadComponent: () => import('@features/studios/my-cube-view/my-cube-view.component').then(m => m.MyCubeViewComponent)
            },
            {
                path: 'calendar',
                loadComponent: () => import('@features/bookings/calendar-view/calendar-view.component').then(m => m.CalendarViewComponent)
            },
            {
                path: 'bookings',
                canActivate: [authGuard],
                loadComponent: () => import('@features/bookings/bookings-view/bookings-view.component').then(m => m.BookingsViewComponent)
            },
            {
                path: 'profile',
                canActivate: [authGuard],
                loadComponent: () => import('@features/profile/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
            },
            {
                path: 'studio-details/:id',
                loadComponent: () => import('@features/studios/studios-view/studio-details/studio-details.component').then(m => m.StudioDetailsComponent)
            },
            {
                path: 'booking-details/:id',
                canActivate: [authGuard],
                loadComponent: () => import('@features/bookings/bookings-view/booking-details/booking-details.component').then(m => m.BookingDetailsComponent)
            },
            {
                path: 'payment-history',
                canActivate: [authGuard],
                loadComponent: () => import('@features/payments/payment-history-view/payment-history-view.component').then(m => m.PaymentHistoryViewComponent)
            }
        ]
    },

    { path: '**', redirectTo: 'studios' }
];
