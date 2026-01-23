import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {StudioService} from '../../../../services/studio.service';
import {Studio} from '../../../../models/Studio';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {UpdateStudioComponent} from './update-studio/update-studio.component';
import {DeleteStudioComponent} from './delete-studio/delete-studio.component';
import {LoadingSpinnerComponent} from '../../../../shared/loading-spinner/loading-spinner.component';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../../../services/auth/auth.service';
import { StudiosComponent } from '../../components/studios/studios.component';

@Component({
    selector: 'app-studios-view',
    standalone: true,
    imports: [StudiosComponent, CommonModule, LoadingSpinnerComponent, TableModule, ButtonModule, UpdateStudioComponent, DeleteStudioComponent],
    templateUrl: './studios-view.component.html',
    styleUrl: './studios-view.component.css'
})
export class StudiosViewComponent implements OnInit {
    studios$ = this.studioService.studios$;
    loading$ = this.studioService.loading$;
    isAdmin = false;

    totalPages = 0;

    ngOnInit(): void {
        this.isAdmin = this.authService.getRole() === "ADMIN"
        this.loadPage(this.studioService.page);
    }

    constructor(public studioService: StudioService, private router: Router, private authService: AuthService) {
    }

    navigateToDetails(studio: Studio): void {
        const basePath = this.isAdmin ? '/admin-dashboard' : '/user-dashboard';
        const navigationUrl = [basePath, 'studio-details', studio.id];

        this.router.navigate(navigationUrl);
    }

    loadPage(page: number): void {
        this.studioService.page = page;
        this.studioService.getAll(page, this.studioService.size).subscribe(res => {
            this.totalPages = res.totalPages;
            this.studioService.setStudios(res.content);
        });
    }
}
