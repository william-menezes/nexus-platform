import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { CashSession, CashRegister, CashMovement } from '@nexus-platform/shared-types';
import { FinancialService } from '../../financial.service';

@Component({
  standalone: true,
  selector: 'app-cash-session',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, InputNumberModule,
    InputTextModule, SelectModule, ButtonModule, TagModule, TableModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './cash-session.component.html',
})
export class CashSessionComponent implements OnInit {
  private svc = inject(FinancialService);
  private msg = inject(MessageService);
  private fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Caixa', routerLink: '/app/financeiro/caixa' },
    { label: 'Sessão Atual' },
  ];

  session = signal<CashSession | null>(null);
  registers = signal<CashRegister[]>([]);
  movements = signal<CashMovement[]>([]);
  acting = signal(false);

  movTypes = [
    { label: 'Recebimento', value: 'receipt' },
    { label: 'Sangria', value: 'withdrawal' },
    { label: 'Despesa', value: 'expense' },
    { label: 'Ajuste', value: 'adjustment' },
  ];

  openForm = this.fb.group({
    cashRegisterId: ['', Validators.required],
    openingAmount: [0, Validators.required],
  });

  closeForm = this.fb.group({
    closingAmount: [0, Validators.required],
    notes: [null as string | null],
  });

  movForm = this.fb.group({
    type: ['receipt', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', Validators.required],
  });

  ngOnInit() {
    this.svc.getRegisters().subscribe(r => this.registers.set(r));
    this.loadSession();
  }

  loadSession() {
    this.svc.getCurrentSession().subscribe(s => {
      this.session.set(s);
      if (s) {
        this.svc.getSession(s.id).subscribe(full => this.movements.set(full.movements ?? []));
      }
    });
  }

  openSession() {
    if (this.openForm.invalid) return;
    this.acting.set(true);
    const dto = this.openForm.getRawValue() as { cashRegisterId: string; openingAmount: number };
    this.svc.openSession(dto).subscribe({
      next: () => { this.acting.set(false); this.loadSession(); this.msg.add({ severity: 'success', summary: 'Caixa aberto' }); },
      error: (e) => { this.acting.set(false); this.msg.add({ severity: 'error', summary: e.error?.message ?? 'Erro ao abrir caixa' }); },
    });
  }

  closeSession() {
    if (this.closeForm.invalid) return;
    this.acting.set(true);
    const raw = this.closeForm.getRawValue();
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as { closingAmount: number; notes?: string };
    this.svc.closeSession(dto).subscribe({
      next: () => { this.acting.set(false); this.session.set(null); this.movements.set([]); this.msg.add({ severity: 'success', summary: 'Caixa fechado' }); },
      error: () => { this.acting.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao fechar caixa' }); },
    });
  }

  addMovement() {
    if (this.movForm.invalid) return;
    this.acting.set(true);
    const dto = this.movForm.getRawValue() as { type: string; amount: number; description: string };
    this.svc.createMovement(dto).subscribe({
      next: () => { this.acting.set(false); this.movForm.reset({ type: 'receipt', amount: 0, description: '' }); this.loadSession(); },
      error: () => { this.acting.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao registrar' }); },
    });
  }

  isCredit(type: string) {
    return ['sale', 'receipt'].includes(type);
  }

  movLabel(type: string) {
    const map: Record<string, string> = {
      sale: 'Venda', receipt: 'Recebimento', withdrawal: 'Sangria', expense: 'Despesa', adjustment: 'Ajuste',
    };
    return map[type] ?? type;
  }
}
