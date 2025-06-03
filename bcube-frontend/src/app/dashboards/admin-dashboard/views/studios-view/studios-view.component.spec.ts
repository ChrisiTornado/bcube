import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudiosViewComponent } from './studios-view.component';

describe('StudiosViewComponent', () => {
  let component: StudiosViewComponent;
  let fixture: ComponentFixture<StudiosViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudiosViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StudiosViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
