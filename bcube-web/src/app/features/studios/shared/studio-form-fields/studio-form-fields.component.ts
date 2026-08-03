import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { PickedImage } from '@shared/util/image-file.util';
import { StudioImagePickerComponent } from '@features/studios/studio-image-picker/studio-image-picker.component';

@Component({
  selector: 'app-studio-form-fields',
  imports: [ReactiveFormsModule, InputTextModule, TextareaModule, StudioImagePickerComponent],
  templateUrl: './studio-form-fields.component.html',
  styleUrl: './studio-form-fields.component.css'
})
export class StudioFormFieldsComponent {
  @Input() form!: FormGroup;
  @Input() submitted = false;
  @Input() pickedImages: PickedImage[] = [];
  @Input() showImageError = false;
  @Output() imagesChange = new EventEmitter<PickedImage[]>();

  get name() { return this.form.get('name') as FormControl; }
  get description() { return this.form.get('description') as FormControl; }
  get city() { return this.form.get('city') as FormControl; }
  get country() { return this.form.get('country') as FormControl; }
  get plz() { return this.form.get('plz') as FormControl; }
  get street() { return this.form.get('street') as FormControl; }
  get smartlockId() { return this.form.get('smartlockId') as FormControl; }
  get images() { return this.form.get('images')!; }
}
