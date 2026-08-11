import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { UserShellComponent } from './user-shell.component';

describe('UserShellComponent', () => {
  let component: UserShellComponent;
  let fixture: ComponentFixture<UserShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserShellComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]), MessageService, ConfirmationService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
