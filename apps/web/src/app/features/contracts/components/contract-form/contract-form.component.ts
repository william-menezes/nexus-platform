import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MessageService, MenuItem } from 'primeng/api';
import { ContractsService } from '../../contracts.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface ClientOption { id: string; name: string; }

@Component({
  standalone: true,
  selector: 'app-contract-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule, DatePickerModule,
    SelectModule, TextareaModule, CardModule, ToastModule, BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './contract-form.component.html',
})
export class ContractFormComponent implements OnInit {
  private readonly svc = inject(ContractsService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly clients = signal<ClientOption[]>([]);
  readonly isEdit = signal(!!this.route.snapshot.paramMap.get('id'));
  readonly saving = signal(false);
  private editId: string | null = null;

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs = computed<MenuItem[]>(() => [
    { label: 'Contratos', routerLink: '/app/contratos' },
    { label: this.isEdit() ? (this.contractData()?.code ?? 'Editar Contrato') : 'Novo Contrato' },
  ]);

  readonly contractData = signal<{ code: string } | null>(null);

  readonly typeOptions = [
    { label: 'Mensal Fixo',        value: 'fixed' },
    { label: 'Franquia de Horas',  value: 'hourly_franchise' },
  ];

  readonly form = this.fb.group({
    clientId:        ['', Validators.required],
    type:            ['fixed', Validators.required],
    description:     [''],
    monthlyValue:    [null as number | null],
    franchiseHours:  [null as number | null],
    hourExcessPrice: [null as number | null],
    startDate:       [null as Date | null, Validators.required],
    endDate:         [null as Date | null],
    billingDay:      [1],
    adjustmentRate:  [0],
    notes:           [''],
  });

  ngOnInit() {
    this.http.get<ClientOption[]>(`${environment.apiUrl}/clients`).subscribe(
      c => this.clients.set(c),
    );

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = id;
      this.svc.findOne(id).subscribe(c => {
        this.contractData.set({ code: c.code });
        this.form.patchValue({
          ...c,
          startDate: c.startDate ? new Date(c.startDate) : null,
          endDate: c.endDate ? new Date(c.endDate) : null,
        });
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: any = {
      ...raw,
      startDate: raw.startDate ? (raw.startDate as Date).toISOString().split('T')[0] : undefined,
      endDate: raw.endDate ? (raw.endDate as Date).toISOString().split('T')[0] : undefined,
    };

    const req = this.isEdit()
      ? this.svc.update(this.editId!, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: (c) => {
        this.msg.add({ severity: 'success', summary: this.isEdit() ? 'Salvo' : 'Criado', detail: c.code });
        this.router.navigate(['/app/contratos', c.id]);
      },
      error: (err) => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar', detail: err?.error?.message });
        this.saving.set(false);
      },
    });
  }
}
