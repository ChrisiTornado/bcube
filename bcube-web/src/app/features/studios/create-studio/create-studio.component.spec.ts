import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { CreateStudioComponent } from '@features/studios/create-studio/create-studio.component';

describe('CreateStudioComponent', () => {
  let component: CreateStudioComponent;
  let fixture: ComponentFixture<CreateStudioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateStudioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateStudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
