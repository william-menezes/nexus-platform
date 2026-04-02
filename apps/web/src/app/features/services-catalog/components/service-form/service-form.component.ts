import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ServiceCatalog } from '@nexus-platform/shared-types';
import { ServicesCatalogService } from '../../services-catalog.service';

@Component({
  standalone: true,
  selector: 'app-service-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule,
    TextareaModule, InputNumberModule, ToggleButtonModule, ButtonModule, ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="nx-page max-w-lg">
      <div class="flex items-center gap-2 mb-4">
        <a routerLink="/app/servicos" pButton icon="pi pi-arrow-left" class="p-button-text p-button-sm"></a>
        <h1 class="text-2xl font-bold">{{ isEdit ? 'Editar Serviço' : 'Novo Serviço' }}</h1>
      </div>
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <label>Nome *</label>
          <input pInputText formControlName="name" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Descrição</label>
          <textarea pTextarea formControlName="description" rows="3"></textarea>
        </div>
        <div class="flex flex-col gap-1">
          <label>Preço Padrão *</label>
          <p-inputNumber formControlName="defaultPrice" mode="currency" currency="BRL" locale="pt-BR" />
        </div>
        <div class="flex flex-col gap-1">
          <label>Horas Estimadas</label>
          <p-inputNumber formControlName="estimatedHours" [min]="0" [minFractionDigits]="1" suffix="h" />
        </div>
        <div class="flex items-center gap-2">
          <p-toggleButton formControlName="isActive" onLabel="Ativo" offLabel="Inativo" />
        </div>
        <div class="flex gap-2 mt-2">
          <button pButton type="submit" label="Salvar" [loading]="saving()" [disabled]="form.invalid"></button>
          <a routerLink="/app/servicos" pButton class="p-button-secondary" label="Cancelar"></a>
        </div>
      </form>
    </div>
  `,
})
export class ServiceFormComponent implements OnInit {
  private svc = inject(ServicesCatalogService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  isEdit = false;
  editId = '';
  saving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [null as string | null],
    defaultPrice: [0, Validators.required],
    estimatedHours: [null as number | null],
    isActive: [true],
  });

  ngOnInit() {
    this.editId = this.route.snapshot.params['id'];
    if (this.editId) {
      this.isEdit = true;
      this.svc.getOne(this.editId).subscribe(s => this.form.patchValue(s as any));
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as Partial<ServiceCatalog>;
    const req = this.isEdit ? this.svc.update(this.editId, dto) : this.svc.create(dto);
    req.subscribe({
      next: () => this.router.navigate(['/app/servicos']),
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }
}
