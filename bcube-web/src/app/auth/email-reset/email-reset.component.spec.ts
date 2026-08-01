import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EmailResetComponent } from './email-reset.component';

describe('EmailResetComponent', () => {
  let component: EmailResetComponent;
  let fixture: ComponentFixture<EmailResetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailResetComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), MessageService, ConfirmationService]
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
