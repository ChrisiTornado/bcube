import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

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
        ]
    },

    {
        path: 'admin-dashboard',
        loadComponent: () => import('@app/layout/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
        canActivate: [authGuard, roleGuard],
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
            { path: 'map', redirectTo: 'studios', pathMatch: 'full' },
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
            }
        ]
    },
    {
        path: 'user-dashboard',
        loadComponent: () => import('@app/layout/user-shell/user-shell.component').then(m => m.UserShellComponent),
        canActivate: [authGuard, roleGuard],
        data: { expectedRole: 'USER' },
        children: [
            { path: '', redirectTo: 'studios', pathMatch: 'full' },
            {
                path: 'studios',
                loadComponent: () => import('@features/studios/studios-view/studios-view.component').then(m => m.StudiosViewComponent)
            },
            { path: 'map', redirectTo: 'studios', pathMatch: 'full' },
            {
                path: 'bookings',
                loadComponent: () => import('@features/bookings/calendar-view/calendar-view.component').then(m => m.CalendarViewComponent)
            },
            {
                path: 'all-bookings',
                loadComponent: () => import('@features/bookings/bookings-view/bookings-view.component').then(m => m.BookingsViewComponent)
            },
            { path: 'calendar', redirectTo: 'bookings', pathMatch: 'full' },
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
            }
        ]
    },

    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];
