import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SuppliersService } from '../../suppliers.service';

@Component({
  standalone: true,
  selector: 'app-supplier-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, TextareaModule, CardModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-2xl mx-auto">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/fornecedores" pButton icon="pi pi-arrow-left"
          class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold">{{ isEdit() ? 'Editar Fornecedor' : 'Novo Fornecedor' }}</h1>
      </div>

      <p-card>
        <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1 md:col-span-2">
              <label class="font-medium">Nome *</label>
              <input pInputText formControlName="name" placeholder="Razão social / nome" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">CNPJ</label>
              <input pInputText formControlName="cnpj" placeholder="00.000.000/0000-00" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Contato</label>
              <input pInputText formControlName="contact" placeholder="Nome do contato" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Telefone</label>
              <input pInputText formControlName="phone" placeholder="(00) 00000-0000" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="font-medium">Email</label>
              <input pInputText formControlName="email" placeholder="fornecedor@email.com" type="email" />
            </div>
          </div>

          <fieldset class="border border-gray-200 rounded p-3">
            <legend class="text-sm font-medium px-1">Endereço</legend>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2" formGroupName="address">
              <div class="flex flex-col gap-1 md:col-span-2">
                <label class="font-medium text-sm">Logradouro</label>
                <input pInputText formControlName="street" placeholder="Rua, Avenida..." />
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-medium text-sm">Número</label>
                <input pInputText formControlName="number" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-medium text-sm">Complemento</label>
                <input pInputText formControlName="complement" placeholder="Sala, Andar..." />
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-medium text-sm">Bairro</label>
                <input pInputText formControlName="neighborhood" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-medium text-sm">Cidade</label>
                <input pInputText formControlName="city" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-medium text-sm">Estado</label>
                <input pInputText formControlName="state" maxlength="2" placeholder="SP" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="font-medium text-sm">CEP</label>
                <input pInputText formControlName="zipCode" placeholder="00000-000" />
              </div>
            </div>
          </fieldset>

          <div class="flex flex-col gap-1">
            <label class="font-medium">Observações</label>
            <textarea pTextarea formControlName="notes" rows="3"
              placeholder="Observações gerais sobre o fornecedor..."></textarea>
          </div>

          <div class="flex justify-end gap-2">
            <a routerLink="/app/fornecedores" pButton label="Cancelar"
              class="p-button-outlined p-button-sm"></a>
            <button pButton type="submit" [label]="isEdit() ? 'Salvar' : 'Criar'"
              icon="pi pi-check" class="p-button-sm"
              [disabled]="form.invalid || saving()"></button>
          </div>
        </form>
      </p-card>
    </div>
  `,
})
export class SupplierFormComponent implements OnInit {
  private readonly svc = inject(SuppliersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
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
