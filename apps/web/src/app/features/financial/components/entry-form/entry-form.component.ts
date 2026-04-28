import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { FinancialEntry } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

@Component({
  standalone: true,
  selector: 'app-entry-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule, TextareaModule,
    InputNumberModule, SelectModule, ButtonModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './entry-form.component.html',
})
export class EntryFormComponent {
  private readonly route = inject(ActivatedRoute);
  readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));
  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Lançamentos', routerLink: '/app/financeiro/lancamentos' },
      { label: this.isEdit() ? 'Editar Lançamento' : 'Novo Lançamento' },
    ];
  }
  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };

  private svc = inject(FinancialService);
  private router = inject(Router);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  saving = signal(false);

  typeOptions = [
    { label: 'A Receber', value: 'receivable' },
    { label: 'A Pagar', value: 'payable' },
  ];

  form = this.fb.group({
    type: ['receivable', Validators.required],
    description: ['', Validators.required],
    totalAmount: [0, [Validators.required, Validators.min(0.01)]],
    dueDate: ['', Validators.required],
    installmentCount: [1],
    notes: [null as string | null],
  });

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as Partial<FinancialEntry> & { installmentCount?: number };
    this.svc.createEntry(dto).subscribe({
      next: () => this.router.navigate(['/app/financeiro']),
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }
}
