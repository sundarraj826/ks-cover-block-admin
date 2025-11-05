import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { startWith, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit, OnDestroy {
  productsList: string[] = [
    'Round Concrete Block',
    'Round RCC Block',
    'Rectangular Concrete Block',
    'Trapezoidal Concrete Block'
  ];

  // CGST = 9%, SGST = 9%
  private readonly CGST_RATE = 0.09;
  private readonly SGST_RATE = 0.09;

  productForm: FormGroup;
  private sub = new Subscription();

  private _fb = inject(FormBuilder);

  constructor() {
    this.productForm = this._fb.group({
      dealerName: ['', Validators.required],
      productItems: this._fb.array([]),
      cgst: [{ value: 0, disabled: true }],
      scst: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
    });
  }

  // strongly typed getter so TS knows this is a FormArray
  get productItems(): FormArray<FormGroup> {
    return this.productForm.get('productItems') as FormArray<FormGroup>;
  }

  ngOnInit(): void {
    // recalc totals when productItems change (startWith for initial calc)
    this.sub.add(
      this.productItems.valueChanges
        .pipe(startWith(this.productItems.value))
        .subscribe(() => this.updateTotals())
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  addProduct(): void {
    const row = this._fb.group({
      product: ['', Validators.required],
      productSize: ['', Validators.required],
      numberOfBox: [0, [Validators.required, Validators.min(1)]],
      boxRate: [0, [Validators.required, Validators.min(0.01)]]
    });

    this.productItems.push(row);

    // compute right after push
    this.updateTotals();
  }

  removeProduct(index: number): void {
    this.productItems.removeAt(index);
    this.updateTotals();
  }

  // compute totals by iterating FormArray.controls (not productForm.controls)
  private updateTotals(): void {
    let subtotal = 0;

    for (const ctrl of this.productItems.controls) {
      const group = ctrl as FormGroup;
      const num = Number(group.get('numberOfBox')?.value) || 0;
      const rate = Number(group.get('boxRate')?.value) || 0;
      subtotal += num * rate;
    }

    const cgst = subtotal * this.CGST_RATE;
    const scst = subtotal * this.SGST_RATE;
    const total = subtotal + cgst + scst;

    this.productForm.patchValue(
      {
        cgst: cgst,
        scst: scst,
        total: total
      },
      { emitEvent: false }
    );
  }

  productFormSubmit(): void {
    if (this.productForm.invalid || this.productItems.length === 0) {
      this.productForm.markAllAsTouched();
      return;
    }

    console.log('raw payload:', this.productForm.getRawValue());
  }
}
