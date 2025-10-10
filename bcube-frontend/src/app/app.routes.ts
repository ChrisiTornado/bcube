import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminDashboardComponent } from './dashboards/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './dashboards/user-dashboard/user-dashboard.component';
import { UsersViewComponent } from './dashboards/admin-dashboard/views/users-view/users-view.component';
import { StudiosViewComponent } from './dashboards/shared/views/studios-view/studios-view.component';
import { MapViewComponent } from './dashboards/shared/views/map-view/map-view.component';
import { CalendarViewComponent } from './dashboards/shared/views/calendar-view/calendar-view.component';
import { BookingsViewComponent } from './dashboards/shared/views/bookings-view/bookings-view.component';
import { StudioDetailsComponent } from './dashboards/shared/views/studios-view/studio-details/studio-details.component';
import { BookingDetailsComponent } from './dashboards/shared/views/bookings-view/booking-details/booking-details.component';
import { ChangePasswordComponent } from './auth/change-password/change-password.component';
import { EmailResetComponent } from './auth/email-reset/email-reset.component';
import { EnterCodeComponent } from './auth/enter-code/enter-code.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },

    {
        path: 'auth',
        children: [
            { path: 'change-password', component: ChangePasswordComponent },
            { path: 'email-reset', component: EmailResetComponent },
            { path: 'enter-code', component: EnterCodeComponent },
        ]
    },

    {
        path: 'admin-dashboard',
        component: AdminDashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { expectedRole: 'ADMIN' },
        children: [
            { path: '', redirectTo: 'studios', pathMatch: 'full' },
            { path: 'studios', component: StudiosViewComponent },
            { path: 'users', component: UsersViewComponent },
            { path: 'studio', component: StudiosViewComponent },
            { path: 'map', component: MapViewComponent },
            { path: 'bookings', component: BookingsViewComponent },
            { path: 'calendar', component: CalendarViewComponent },
            { path: 'studio-details/:id', component: StudioDetailsComponent },
            { path: 'booking-details/:id', component: BookingDetailsComponent }
        ]
    },
    {
        path: 'user-dashboard',
        component: UserDashboardComponent,
        canActivate: [authGuard, roleGuard],
        data: { expectedRole: 'USER' },
        children: [
            { path: '', redirectTo: 'studios', pathMatch: 'full' },
            { path: 'studios', component: StudiosViewComponent },
            { path: 'users', component: UsersViewComponent },
            { path: 'studio', component: StudiosViewComponent },
            { path: 'map', component: MapViewComponent },
            { path: 'bookings', component: BookingsViewComponent },
            { path: 'calendar', component: CalendarViewComponent },
            { path: 'studio-details/:id', component: StudioDetailsComponent },
            { path: 'booking-details/:id', component: BookingDetailsComponent }
        ]
    },

    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: '**', redirectTo: 'login' }
];