import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { User } from '@models/user.model';

export function buildUserForm(fb: FormBuilder, user?: User): FormGroup {
  return fb.group({
    firstName: [user?.firstName ?? null, Validators.required],
    lastName: [user?.lastName ?? null, Validators.required],
    email: [user?.email ?? null, [Validators.required, Validators.email]],
    phone: [user?.phone ?? null, Validators.required],
    isAdmin: [user?.isAdmin ?? false, Validators.required]
  });
}
