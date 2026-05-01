import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { Client, Quote } from '@nexus-platform/shared-types';
import { QuotesService } from '../../quotes.service';
import { ClientsService } from '../../../clients/clients.service';

const ITEM_TYPES = [
  { label: 'Produto', value: 'product' },
  { label: 'Serviço', value: 'service' },
];

@Component({
  standalone: true,
  selector: 'app-quote-form',
  imports: [
    ReactiveFormsModule, FormsModule, RouterLink,
    InputTextModule, TextareaModule, InputNumberModule, InputMaskModule,
    SelectModule, DatePickerModule, ButtonModule, CardModule, DividerModule,
    AutoCompleteModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './quote-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteFormComponent implements OnInit {
  private readonly svc           = inject(QuotesService);
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
  itemTypes = ITEM_TYPES;

  /** Autocomplete de cliente */
  selectedClient: Client | null    = null;
  clientSuggestions: Client[]      = [];
  private readonly clientSearch$   = new Subject<string>();

  form = this.fb.group({
    clientId:       ['', Validators.required],
    description:    [null as string | null],
    validUntil:     [null as string | null],
    discountAmount: [0],
    items:          this.fb.array([]),
  });

  get itemsArray() { return this.form.get('items') as FormArray; }

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

    this.editId = this.route.snapshot.params['id'];
    this.isEdit = !!this.editId;
    this.breadcrumbSvc.set([
      { label: 'Orçamentos', routerLink: '/app/orcamentos' },
      { label: this.isEdit ? 'Editar Orçamento' : 'Novo Orçamento' },
    ]);
    if (this.editId) {
      this.svc.getOne(this.editId).subscribe(q => {
        this.form.patchValue({
          clientId:       q.clientId,
          description:    q.description ?? null,
          validUntil:     q.validUntil  ?? null,
          discountAmount: q.discountAmount,
        });
        (q.items ?? []).forEach(item => {
          this.itemsArray.push(this.buildItemGroup({
            itemType:    item.itemType,
            description: item.description,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
          }));
        });
        this.cdr.markForCheck();
      });
    }
  }

  /** Pesquisa clientes pelo texto digitado — emite para stream com debounce */
  searchClients(event: AutoCompleteCompleteEvent) {
    this.clientSearch$.next(event.query);
  }

  /** Ao selecionar um cliente, preenche o clientId no form */
  onClientSelect(event: AutoCompleteSelectEvent) {
    const c: Client = event.value;
    this.form.patchValue({ clientId: c.id });
  }

  /** Ao limpar o autocomplete, limpa o clientId */
  onClientClear() {
    this.form.patchValue({ clientId: '' });
    this.selectedClient = null;
  }

  addItem() {
    this.itemsArray.push(this.buildItemGroup());
  }

  removeItem(i: number) {
    this.itemsArray.removeAt(i);
  }

  private buildItemGroup(defaults?: {
    itemType?:    string;
    description?: string;
    quantity?:    number;
    unitPrice?:   number;
  }) {
    return this.fb.group({
      itemType:    [defaults?.itemType    ?? 'product'],
      description: [defaults?.description ?? '', Validators.required],
      quantity:    [defaults?.quantity    ?? 1],
      unitPrice:   [defaults?.unitPrice   ?? 0],
      discount:    [0],
      sortOrder:   [0],
    });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null),
    ) as Partial<Quote>;
    const req = this.isEdit ? this.svc.update(this.editId, dto) : this.svc.create(dto);
    req.subscribe({
      next:  q => this.router.navigate(['/app/orcamentos', q.id]),
      error: () => {
        this.saving.set(false);
        this.msg.add({ severity: 'error', summary: 'Erro ao salvar orçamento' });
        this.cdr.markForCheck();
      },
    });
  }
}
