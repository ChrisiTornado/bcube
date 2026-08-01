import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

import { UpdateStudioComponent } from './update-studio.component';
import { Studio } from '../../../../../models/Studio';

describe('UpdateStudioComponent', () => {
  let component: UpdateStudioComponent;
  let fixture: ComponentFixture<UpdateStudioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateStudioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), MessageService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateStudioComponent);
    component = fixture.componentInstance;
    component.studio = {
      id: 1, smartlockId: 1, name: 'Test Cube', description: 'Test', street: 'Teststraße 1',
      plz: 1010, isActive: true, city: 'Wien', country: 'Österreich', image: [], imageBase64: ''
    } as Studio;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
