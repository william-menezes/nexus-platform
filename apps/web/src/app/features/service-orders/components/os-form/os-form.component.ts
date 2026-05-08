import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { ServiceOrdersService } from '../../service-orders.service';
import { ClientsService } from '../../../clients/clients.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  standalone: true,
  selector: 'app-os-form',
  imports: [
    ReactiveFormsModule, FormsModule, RouterLink,
    ButtonModule, InputTextModule, InputMaskModule, TextareaModule,
    InputNumberModule, AutoCompleteModule, MessageModule,
    CardModule, DividerModule, ToastModule, PageHeaderComponent,
  ],
  providers: [MessageService],
  templateUrl: './os-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OsFormComponent implements OnInit {
  private readonly fb             = inject(FormBuilder);
  private readonly svc            = inject(ServiceOrdersService);
  private readonly clientsSvc     = inject(ClientsService);
  private readonly router         = inject(Router);
  private readonly route          = inject(ActivatedRoute);
  private readonly destroyRef     = inject(DestroyRef);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly breadcrumbSvc  = inject(BreadcrumbService);

  editId:     string | null = null;
  submitting  = false;
  error       = '';

  /** Autocomplete de cliente (fora do FormGroup) */
  selectedClient: Client | null  = null;
  clientSuggestions: Client[]    = [];
  private readonly clientSearch$ = new Subject<string>();

  form = this.fb.group({
    clientId:    [''],
    clientName:  ['', Validators.required],
    clientPhone: [''],
    description: ['', Validators.required],
    priceIdeal:  [null as number | null],
  });

  get isEdit() { return !!this.editId; }

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

    this.editId = this.route.snapshot.paramMap.get('id');
    this.breadcrumbSvc.set([
      { label: 'Ordens de Serviço', routerLink: '/app/os' },
      { label: this.editId ? 'Editar OS' : 'Nova OS' },
    ]);
    if (this.editId) {
      this.svc.getOne(this.editId).subscribe({
        next:  (os) => { this.form.patchValue(os as never); this.cdr.markForCheck(); },
        error: ()   => { this.error = 'OS não encontrada.'; this.cdr.markForCheck(); },
      });
    } else {
      const clientId = this.route.snapshot.queryParamMap.get('clientId');
      if (clientId) {
        this.clientsSvc.getOne(clientId).subscribe({
          next: (c) => {
            this.selectedClient = c;
            this.form.patchValue({ clientId: c.id, clientName: c.name, clientPhone: c.phone ?? '' });
            this.cdr.markForCheck();
          },
        });
      }
    }
  }

  /** Pesquisa clientes pelo texto digitado — emite para stream com debounce */
  searchClients(event: AutoCompleteCompleteEvent) {
    this.clientSearch$.next(event.query);
  }

  /** Ao selecionar um cliente no autocomplete, preenche os campos do form */
  onClientSelect(event: AutoCompleteSelectEvent) {
    const c: Client = event.value;
    this.form.patchValue({
      clientId:    c.id,
      clientName:  c.name,
      clientPhone: c.phone ?? '',
    });
  }

  /** Ao limpar o autocomplete, limpa o clientId */
  onClientClear() {
    this.form.patchValue({ clientId: '', clientName: '', clientPhone: '' });
    this.selectedClient = null;
  }

  /** Texto exibido no dropdown */
  clientLabel(c: Client): string {
    const doc = c.cpfCnpj ? ` — ${c.cpfCnpj}` : '';
    const tel = c.phone   ? ` | ${c.phone}`    : '';
    return `${c.name}${doc}${tel}`;
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const dto = this.form.value;
    const req = this.editId
      ? this.svc.update(this.editId, dto as never)
      : this.svc.create(dto as never);

    req.subscribe({
      next:  () => this.router.navigate(['/app/os']),
      error: () => { this.error = 'Erro ao salvar OS.'; this.submitting = false; this.cdr.markForCheck(); },
    });
  }
}
