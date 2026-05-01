import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SettingsService } from '../../settings.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';

@Component({
  standalone: true,
  selector: 'app-general-settings',
  imports: [
    CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule,
    InputNumberModule, SelectModule, CardModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './general-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralSettingsComponent implements OnInit {
  private readonly svc = inject(SettingsService);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  constructor() {
    this.breadcrumbSvc.set([
      { label: 'Configurações', routerLink: '/app/configuracoes' },
      { label: 'Geral' },
    ]);
  }

  readonly saving = signal(false);

  readonly currencies = [
    { label: 'Real Brasileiro (BRL)', value: 'BRL' },
    { label: 'Dólar Americano (USD)', value: 'USD' },
  ];

  readonly timezones = [
    { label: 'America/Sao_Paulo', value: 'America/Sao_Paulo' },
    { label: 'America/Manaus', value: 'America/Manaus' },
    { label: 'America/Belem', value: 'America/Belem' },
    { label: 'America/Fortaleza', value: 'America/Fortaleza' },
    { label: 'America/Recife', value: 'America/Recife' },
    { label: 'America/Noronha', value: 'America/Noronha' },
    { label: 'America/Porto_Velho', value: 'America/Porto_Velho' },
    { label: 'America/Boa_Vista', value: 'America/Boa_Vista' },
    { label: 'America/Rio_Branco', value: 'America/Rio_Branco' },
  ];

  readonly form = this.fb.group({
    osCodePrefix: ['', Validators.required],
    quoteCodePrefix: ['', Validators.required],
    saleCodePrefix: ['', Validators.required],
    quoteValidityDays: [30, [Validators.required, Validators.min(1)]],
    warrantyDays: [90, [Validators.required, Validators.min(0)]],
    currency: ['BRL', Validators.required],
    timezone: ['America/Sao_Paulo', Validators.required],
  });

  ngOnInit() {
    this.svc.getSettings().subscribe(s => this.form.patchValue(s as any));
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.svc.updateSettings(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Configurações salvas' });
        this.saving.set(false);
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar' });
        this.saving.set(false);
      },
    });
  }
}
