import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Client, Equipment, EquipmentType } from '@nexus-platform/shared-types';
import { EquipmentsService } from '../../equipments.service';
import { ClientsService } from '../../../clients/clients.service';

@Component({
  standalone: true,
  selector: 'app-equipment-form',
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule, FormsModule, InputTextModule,
    TextareaModule, SelectModule, ButtonModule, CardModule, ToastModule,
    AutoCompleteModule, PageHeaderComponent,
  ],
  providers: [MessageService],
  templateUrl: './equipment-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentFormComponent implements OnInit {
  private readonly svc           = inject(EquipmentsService);
  private readonly clientsSvc    = inject(ClientsService);
  private readonly router        = inject(Router);
  private readonly route         = inject(ActivatedRoute);
  private readonly msg           = inject(MessageService);
  private readonly fb            = inject(FormBuilder);
  private readonly destroyRef    = inject(DestroyRef);
  private readonly cdr           = inject(ChangeDetectorRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  isEdit = false;
  editId = '';
  saving = signal(false);
  types  = signal<EquipmentType[]>([]);

  selectedClient: Client | null = null;
  clientSuggestions: Client[]   = [];
  private readonly clientSearch$ = new Subject<string>();

  form = this.fb.group({
    clientId:        [null as string | null],
    equipmentTypeId: ['', Validators.required],
    brand:           [null as string | null],
    model:           [null as string | null],
    notes:           [null as string | null],
  });

  ngOnInit() {
    this.clientSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.clientsSvc.getAll(query)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next:  list => { this.clientSuggestions = list; this.cdr.markForCheck(); },
      error: ()   => { this.clientSuggestions = []; this.cdr.markForCheck(); },
    });

    this.svc.getAllTypes().subscribe(t => this.types.set(t));

    this.editId = this.route.snapshot.params['id'];
    this.isEdit = !!this.editId;
    this.breadcrumbSvc.set([
      { label: 'Equipamentos', routerLink: '/app/equipamentos' },
      { label: this.isEdit ? 'Editar Equipamento' : 'Novo Equipamento' },
    ]);

    if (this.isEdit) {
      this.svc.getOne(this.editId).subscribe(e => this.form.patchValue(e as any));
    } else {
      const clientId = this.route.snapshot.queryParamMap.get('clientId');
      if (clientId) {
        this.clientsSvc.getOne(clientId).subscribe({
          next: (c) => {
            this.selectedClient = c;
            this.form.patchValue({ clientId: c.id });
            this.cdr.markForCheck();
          },
        });
      }
    }
  }

  searchClients(event: AutoCompleteCompleteEvent) {
    this.clientSearch$.next(event.query);
  }

  onClientSelect(event: AutoCompleteSelectEvent) {
    const c: Client = event.value;
    this.form.patchValue({ clientId: c.id });
  }

  onClientClear() {
    this.form.patchValue({ clientId: null });
    this.selectedClient = null;
  }

  clientLabel(c: Client): string {
    return c.phone ? `${c.name} | ${c.phone}` : c.name;
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null)) as Partial<Equipment>;
    const req = this.isEdit ? this.svc.update(this.editId, dto) : this.svc.create(dto);
    req.subscribe({
      next: () => this.router.navigate(['/app/equipamentos']),
      error: () => { this.saving.set(false); this.msg.add({ severity: 'error', summary: 'Erro ao salvar' }); },
    });
  }
}
