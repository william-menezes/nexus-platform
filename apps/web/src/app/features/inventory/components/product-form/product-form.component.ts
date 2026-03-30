import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { InventoryService } from '../../inventory.service';

@Component({
  standalone: true,
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, InputNumberModule, MessageModule],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  private readonly fb     = inject(FormBuilder);
  private readonly svc    = inject(InventoryService);
  private readonly route  = inject(ActivatedRoute);
  private readonly router = inject(Router);

  editId: string | null = null;
  loading  = false;
  error    = '';

  form = this.fb.group({
    name:      ['', Validators.required],
    sku:       [''],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    minStock:  [0, [Validators.required, Validators.min(0)]],
    category:  [''],
  });

  get isEdit() { return !!this.editId; }

  ngOnInit() {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.svc.getProduct(this.editId).subscribe((p) => this.form.patchValue(p as never));
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const dto = this.form.value;
    const req = this.editId
      ? this.svc.updateProduct(this.editId, dto as never)
      : this.svc.createProduct(dto as never);

    req.subscribe({
      next: () => { void this.router.navigate(['/app/estoque']); },
      error: () => { this.error = 'Erro ao salvar produto.'; this.loading = false; },
    });
  }
}
