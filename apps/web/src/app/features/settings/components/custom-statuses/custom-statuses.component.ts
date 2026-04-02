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
import { ConfirmationService, MessageService } from 'primeng/api';
import { SettingsService, CustomStatus } from '../../settings.service';

type EntityType = 'service_order' | 'sale' | 'quote';
type NullableString = string | null;

@Component({
  standalone: true,
  selector: 'app-custom-statuses',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule,
    InputTextModule, ColorPickerModule, SelectModule, CheckboxModule,
    DialogModule, TagModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="flex flex-col gap-4">
      <!-- Entity type tabs -->
      <div class="flex gap-2">
        @for (t of entityTypes; track t.value) {
          <button pButton [label]="t.label"
            [class]="activeType() === t.value ? 'p-button-sm' : 'p-button-sm p-button-outlined'"
            (click)="setType(t.value)"></button>
        }
      </div>

      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-500">
          {{ statuses().length }} status(es) configurados
        </span>
        <button pButton label="Novo Status" icon="pi pi-plus" class="p-button-sm"
          (click)="openDialog()"></button>
      </div>

      <p-table [value]="statuses()" [loading]="loading()" stripedRows>
        <ng-template pTemplate="header">
          <tr>
            <th>Cor</th>
            <th>Nome</th>
            <th>Padrão</th>
            <th>Final</th>
            <th>Sistema</th>
            <th>Ações</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-s>
          <tr>
            <td>
              <span class="inline-block w-6 h-6 rounded-full border"
                [style.background-color]="s.color"></span>
            </td>
            <td>{{ s.name }}</td>
            <td>
              @if (s.isDefault) {
                <p-tag severity="info" value="Padrão" />
              }
            </td>
            <td>
              @if (s.isFinal) {
                <p-tag severity="success" value="Final" />
              }
            </td>
            <td>
              @if (s.isSystem) {
                <p-tag severity="secondary" value="Sistema" />
              }
            </td>
            <td>
              <button pButton icon="pi pi-pencil" class="p-button-sm p-button-text mr-1"
                (click)="openDialog(s)"></button>
              @if (!s.isSystem) {
                <button pButton icon="pi pi-trash"
                  class="p-button-sm p-button-text p-button-danger"
                  (click)="confirmDelete(s)"></button>
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="6" class="text-center text-gray-500 py-6">
              Nenhum status configurado.
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Dialog -->
    <p-dialog [(visible)]="dialogVisible" [header]="editingId() ? 'Editar Status' : 'Novo Status'"
      [modal]="true" [style]="{ width: '400px' }">
      <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-3 pt-2">
        <div class="flex flex-col gap-1">
          <label class="font-medium text-sm">Nome *</label>
          <input pInputText formControlName="name" placeholder="Ex: Em análise" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="font-medium text-sm">Cor</label>
          <div class="flex items-center gap-2">
            <p-colorpicker formControlName="color" format="hex" />
            <span class="text-sm">{{ form.get('color')?.value }}</span>
          </div>
        </div>
        <div class="flex gap-4">
          <div class="flex items-center gap-2">
            <p-checkbox formControlName="isDefault" [binary]="true" inputId="isDefault" />
            <label for="isDefault" class="text-sm">Status padrão</label>
          </div>
          <div class="flex items-center gap-2">
            <p-checkbox formControlName="isFinal" [binary]="true" inputId="isFinal" />
            <label for="isFinal" class="text-sm">Status final</label>
          </div>
        </div>
      </form>
      <ng-template pTemplate="footer">
        <button pButton label="Cancelar" class="p-button-outlined p-button-sm"
          (click)="dialogVisible = false"></button>
        <button pButton label="Salvar" icon="pi pi-check" class="p-button-sm"
          [disabled]="form.invalid || saving()" (click)="save()"></button>
      </ng-template>
    </p-dialog>
  `,
})
export class CustomStatusesComponent implements OnInit {
  private readonly svc = inject(SettingsService);
  private readonly confirm = inject(ConfirmationService);
  private readonly msg = inject(MessageService);
  private readonly fb = inject(FormBuilder);

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
