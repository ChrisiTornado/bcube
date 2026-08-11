import { Component, DestroyRef, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MegaMenuItem } from 'primeng/api';
import { AuthService } from '@core/services/auth.service';
import { MegaMenuModule } from 'primeng/megamenu';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { filter } from 'rxjs/operators';
import { StudioService } from '@features/studios/studio.service';

@Component({
    selector: 'app-user-shell',
    imports: [
    ToastModule,
    ConfirmDialogModule,
    RouterModule,
    MegaMenuModule
],
    templateUrl: './user-shell.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './user-shell.component.css'
})
export class UserShellComponent implements OnInit {
  items: MegaMenuItem[] = [];
  // "Mein Cube" only makes sense while there's exactly one studio to refer to - with several
  // studios "my cube" would be ambiguous, so the tab just doesn't appear.
  private showMyCubeTab = false;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService,
    private studioService: StudioService,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    const message = sessionStorage.getItem('loginSuccessMessage');
    if (message) {
      setTimeout(() => {
        this.messageService.add({
          key: 'main',
          severity: 'success',
          summary: 'Erfolg',
          detail: message
        });
      }, 0);
      sessionStorage.removeItem('loginSuccessMessage');
    }

    this.studioService.getStudiosPagination(0, 1).subscribe(response => {
      this.showMyCubeTab = response.totalElements === 1;
      this.buildMenu();
    });

    // initialer Menüaufbau
    this.buildMenu();

    // Menü bei Navigation aktualisieren
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.buildMenu();
    });
  }

  private isRouteActive(prefixes: string[]): boolean {
    const currentUrl = this.router.url;
    return prefixes.some(prefix => new RegExp(`/${prefix}(/|$)`).test(currentUrl));
  }

  private buildMenu(): void {
    this.items = [
      {
        label: 'Cubes',
        icon: 'pi pi-fw pi-building',
        routerLink: 'studios',
        styleClass: this.isRouteActive(['studios']) ? 'p-menuitem-link-active' : ''
      },
      ...(this.showMyCubeTab
        ? [{
            label: 'Mein Cube',
            icon: 'pi pi-fw pi-star',
            routerLink: 'my-cube',
            styleClass: this.isRouteActive(['my-cube']) ? 'p-menuitem-link-active' : ''
          }]
        : []),
      {
        label: 'Buchungen',
        icon: 'pi pi-fw pi-folder-open',
        routerLink: 'calendar',
        styleClass: this.isRouteActive(['bookings', 'calendar', 'booking-details', 'booking-confirmation']) ? 'p-menuitem-link-active' : ''
      }
    ];
  }

  get avatarLabel(): string {
    const user = this.authService.getUser();
    const source = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email || 'B';

    return source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
