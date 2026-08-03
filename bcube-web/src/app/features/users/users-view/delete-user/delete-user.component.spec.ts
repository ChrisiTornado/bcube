import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteUserComponent } from './delete-user.component';
import { UserActionService } from '@features/users/user-action.service';
import { User } from '@models/user.model';

describe('DeleteUserComponent', () => {
  let component: DeleteUserComponent;
  let fixture: ComponentFixture<DeleteUserComponent>;
  let userActionService: jasmine.SpyObj<UserActionService>;

  const user = { id: 1, firstName: 'Test', lastName: 'User' } as User;

  beforeEach(async () => {
    userActionService = jasmine.createSpyObj('UserActionService', ['confirmDelete']);

    await TestBed.configureTestingModule({
      imports: [DeleteUserComponent],
      providers: [{ provide: UserActionService, useValue: userActionService }]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteUserComponent);
    component = fixture.componentInstance;
    component.user = user;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('delegates to UserActionService.confirmDelete with the current user', () => {
    component.confirmDelete();

    expect(userActionService.confirmDelete).toHaveBeenCalledWith(user, jasmine.any(Function));
  });

  it('tracks the loading state via the setLoading callback', () => {
    component.confirmDelete();
    const setLoading = userActionService.confirmDelete.calls.mostRecent().args[1]!;

    setLoading(true);
    expect(component.loading).toBeTrue();

    setLoading(false);
    expect(component.loading).toBeFalse();
  });
});
