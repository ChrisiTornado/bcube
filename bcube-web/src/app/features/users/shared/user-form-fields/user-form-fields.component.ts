import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-user-form-fields',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './user-form-fields.component.html'
})
export class UserFormFieldsComponent {
  @Input() form!: FormGroup;
  @Input() submitted = false;

  get firstName() { return this.form.get('firstName') as FormControl; }
  get lastName() { return this.form.get('lastName') as FormControl; }
  get email() { return this.form.get('email') as FormControl; }
  get phone() { return this.form.get('phone') as FormControl; }
  get isAdmin() { return this.form.get('isAdmin') as FormControl; }
}
