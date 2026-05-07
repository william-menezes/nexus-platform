import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { FinancialEntry } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

@Component({
  standalone: true,
  selector: 'app-entry-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputTextModule, TextareaModule,
    InputNumberModule, SelectModule, DatePickerModule, ButtonModule, CardModule, ToastModule,
    PageHeaderComponent,
  ],
  providers: [MessageService],
  templateUrl: './entry-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly svc = inject(FinancialService);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));

  constructor() {
    this.breadcrumbSvc.set([
      { label: 'Lançamentos', routerLink: '/app/financeiro/lancamentos' },
      { label: this.isEdit() ? 'Editar Lançamento' : 'Novo Lançamento' },
    ]);
  }

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
