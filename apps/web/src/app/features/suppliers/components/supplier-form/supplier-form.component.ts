import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { SuppliersService } from '../../suppliers.service';

@Component({
  standalone: true,
  selector: 'app-supplier-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, TextareaModule, CardModule, ToastModule,
    BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './supplier-form.component.html',
})
export class SupplierFormComponent implements OnInit {
  private readonly svc = inject(SuppliersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly isEdit = signal(false);
  readonly saving = signal(false);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Fornecedores', routerLink: '/app/fornecedores' },
      { label: this.isEdit() ? 'Editar Fornecedor' : 'Novo Fornecedor' },
    ];
  }
  private editId: string | null = null;

  readonly form = this.fb.group({
    name: ['', Validators.required],
    cnpj: [''],
    contact: [''],
    phone: [''],
    email: [''],
    address: this.fb.group({
      street: [''],
      number: [''],
      complement: [''],
      neighborhood: [''],
      city: [''],
      state: [''],
      zipCode: [''],
    }),
    notes: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId = id;
      this.svc.findOne(id).subscribe(s => {
        this.form.patchValue({
          ...s,
          address: s.address as any,
        });
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = this.form.getRawValue() as any;

    const req = this.isEdit()
      ? this.svc.update(this.editId!, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: this.isEdit() ? 'Salvo' : 'Criado' });
        this.router.navigate(['/app/fornecedores']);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar' });
        this.saving.set(false);
      },
    });
  }
}
