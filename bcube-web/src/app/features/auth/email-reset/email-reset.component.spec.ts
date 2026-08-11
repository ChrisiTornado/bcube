import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EmailResetComponent } from '@features/auth/email-reset/email-reset.component';

describe('EmailResetComponent', () => {
  let component: EmailResetComponent;
  let fixture: ComponentFixture<EmailResetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailResetComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([]), MessageService, ConfirmationService]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmailResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
