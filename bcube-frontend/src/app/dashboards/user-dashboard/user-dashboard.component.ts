import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MegaMenuItem } from 'primeng/api';
import { AuthService } from '../../services/auth/auth.service';
import { MegaMenuModule } from 'primeng/megamenu';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    RouterModule,
    MegaMenuModule
  ],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent implements OnInit {
  items: MegaMenuItem[] = [];

  constructor(
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
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

    // initialer Menüaufbau
    this.buildMenu();

    // Menü bei Navigation aktualisieren
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
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
        label: 'Studios',
        icon: 'pi pi-fw pi-building',
        routerLink: 'studios',
        styleClass: this.isRouteActive(['studios', 'studio-details']) ? 'p-menuitem-link-active' : ''
      },
      {
        label: 'Karte',
        icon: 'pi pi-fw pi-map',
        routerLink: 'map',
        styleClass: this.isRouteActive(['map']) ? 'p-menuitem-link-active' : ''
      },
      {
        label: 'Buchungen',
        icon: 'pi pi-fw pi-folder-open',
        routerLink: 'bookings',
        styleClass: this.isRouteActive(['bookings', 'booking-details', 'booking-confirmation']) ? 'p-menuitem-link-active' : ''
      },
      {
        label: 'Mein Kalendar',
        icon: 'pi pi-fw pi-calendar',
        routerLink: 'calendar',
        styleClass: this.isRouteActive(['calendar']) ? 'p-menuitem-link-active' : ''
      },
      {
        label: 'Logout',
        icon: 'pi pi-fw pi-sign-out',
        command: () => {
          this.confirmationService.confirm({
            message: 'Sind Sie sicher, dass Sie sich abmelden möchten?',
            header: 'Abmeldung bestätigen',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Ja',
            rejectLabel: 'Nein',
            accept: () => {
              this.authService.logout();
            }
          });
        }
      }
    ];
  }
}