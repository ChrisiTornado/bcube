import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CompleteProfileDialogComponent } from '@features/auth/complete-profile-dialog/complete-profile-dialog.component';
import { AuthService } from '@core/services/auth.service';
import { User } from '@models/user.model';
import { isProfileComplete } from '@shared/util/profile-complete.util';

/**
 * Reachable two ways: redirected here right after a Google sign-in that came back incomplete
 * (see OauthCallbackComponent), or bounced here by profileCompleteGuard on any later visit while
 * the account is still missing a required field - so this always re-derives from the currently
 * stored user rather than trusting query params, and simply forwards on if it's already complete.
 */
@Component({
  selector: 'app-complete-profile-page',
  imports: [CompleteProfileDialogComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './complete-profile-page.component.html'
})
export class CompleteProfilePageComponent implements OnInit {
  user: User | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.getUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    if (isProfileComplete(user)) {
      this.redirectToDashboard(user);
      return;
    }

    this.user = user;
  }

  onProfileCompleted(updated: User): void {
    this.redirectToDashboard(updated);
  }

  private redirectToDashboard(user: User): void {
    this.router.navigate([this.authService.isAdmin(user) ? '/admin-dashboard/studios' : '/user-dashboard/studios']);
  }
}
