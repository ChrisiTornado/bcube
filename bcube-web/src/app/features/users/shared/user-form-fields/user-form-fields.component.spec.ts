import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl } from '@angular/forms';
import { UserFormFieldsComponent } from './user-form-fields.component';
import { buildUserForm } from '@features/users/shared/user-form.util';

describe('UserFormFieldsComponent', () => {
  let component: UserFormFieldsComponent;
  let fixture: ComponentFixture<UserFormFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormFieldsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormFieldsComponent);
    component = fixture.componentInstance;
    component.form = buildUserForm(new FormBuilder());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes each field as a FormControl resolved from the given form group', () => {
    expect(component.firstName).toBe(component.form.get('firstName') as FormControl);
    expect(component.lastName).toBe(component.form.get('lastName') as FormControl);
    expect(component.email).toBe(component.form.get('email') as FormControl);
    expect(component.phone).toBe(component.form.get('phone') as FormControl);
    expect(component.isAdmin).toBe(component.form.get('isAdmin') as FormControl);
  });

  it('does not show validation errors before submitted is true', () => {
    component.submitted = false;
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('small');
    expect(errors.length).toBe(0);
  });

  it('shows a required-field error once submitted is true and the field is empty', () => {
    component.submitted = true;
    fixture.detectChanges();

    const errors = fixture.nativeElement.querySelectorAll('small');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('shows an invalid-email error for a badly formatted email once submitted', () => {
    component.form.get('email')!.setValue('not-an-email');
    component.submitted = true;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ungültiges E-Mail-Format');
  });
});
