import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { SettingsService, CustomStatus } from '../../settings.service';

type EntityType = 'service_order' | 'sale' | 'quote';
type NullableString = string | null;

@Component({
  standalone: true,
  selector: 'app-custom-statuses',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
    InputTextModule, ColorPickerModule, SelectModule, CheckboxModule,
    DialogModule, TagModule, ConfirmDialogModule, ToastModule, BreadcrumbModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './custom-statuses.component.html',
})
export class CustomStatusesComponent implements OnInit {
  private readonly svc = inject(SettingsService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };
  readonly breadcrumbs: MenuItem[] = [
    { label: 'Configurações', routerLink: '/app/configuracoes' },
    { label: 'Status Personalizados' },
  ];

  readonly statuses = signal<CustomStatus[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly activeType = signal<EntityType>('service_order');
  readonly editingId = signal<NullableString>(null);
  dialogVisible = false;

  readonly entityTypes: { label: string; value: EntityType }[] = [
    { label: 'Ordens de Serviço', value: 'service_order' },
    { label: 'Vendas', value: 'sale' },
    { label: 'Orçamentos', value: 'quote' },
  ];

  readonly form = this.fb.group({
    name: ['', Validators.required],
    color: ['#6B7280'],
    isDefault: [false],
    isFinal: [false],
  });

  ngOnInit() { this.load(); }

  setType(type: EntityType) {
    this.activeType.set(type);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.getStatuses(this.activeType()).subscribe({
      next: data => { this.statuses.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(status?: CustomStatus) {
    this.editingId.set(status?.id ?? null);
    this.form.reset({
      name: status?.name ?? '',
      color: status?.color ?? '#6B7280',
      isDefault: status?.isDefault ?? false,
      isFinal: status?.isFinal ?? false,
    });
    this.dialogVisible = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const editId = this.editingId();
    const payload = { ...this.form.getRawValue(), entityType: this.activeType() } as any;
    const req = editId
      ? this.svc.updateStatus(editId, payload)
      : this.svc.createStatus(payload);

    req.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Salvo' });
        this.dialogVisible = false;
        this.saving.set(false);
        this.load();
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar' });
        this.saving.set(false);
      },
    });
  }

  confirmDelete(s: CustomStatus) {
    this.confirm.confirm({
      message: `Excluir status "${s.name}"?`,
      accept: () => {
        this.svc.deleteStatus(s.id).subscribe({
          next: () => {
            this.msg.add({ severity: 'success', summary: 'Excluído' });
            this.load();
          },
          error: () => this.msg.add({ severity: 'error', summary: 'Erro ao excluir' }),
        });
      },
    });
  }
}
