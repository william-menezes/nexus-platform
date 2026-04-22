import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService, MenuItem } from 'primeng/api';
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
    SelectModule, ButtonModule, CardModule, BreadcrumbModule, DividerModule,
    AutoCompleteModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './quote-form.component.html',
})
export class QuoteFormComponent implements OnInit {
  private readonly svc        = inject(QuotesService);
  private readonly clientsSvc = inject(ClientsService);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly msg        = inject(MessageService);
  private readonly fb         = inject(FormBuilder);

  isEdit = false;
  editId = '';
  saving = signal(false);
  itemTypes = ITEM_TYPES;

  /** Autocomplete de cliente */
  selectedClient: Client | null = null;
  clientSuggestions: Client[]   = [];

  form = this.fb.group({
    clientId:       ['', Validators.required],
    description:    [null as string | null],
    validUntil:     [null as string | null],
    discountAmount: [0],
    items:          this.fb.array([]),
  });

  get itemsArray() { return this.form.get('items') as FormArray; }

  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Orçamentos', routerLink: '/app/orcamentos' },
      { label: this.isEdit ? 'Editar Orçamento' : 'Novo Orçamento' },
    ];
  }
  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };

  ngOnInit() {
    this.editId = this.route.snapshot.params['id'];
    if (this.editId) {
      this.isEdit = true;
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
      });
    }
  }

  /** Pesquisa clientes pelo texto digitado */
  searchClients(event: AutoCompleteCompleteEvent) {
    this.clientsSvc.getAll(event.query).subscribe({
      next:  (list) => { this.clientSuggestions = list; },
      error: ()     => { this.clientSuggestions = []; },
    });
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
      },
    });
  }
}
