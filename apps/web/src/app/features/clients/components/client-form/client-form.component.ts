import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';

@Component({
  standalone: true,
  selector: 'app-client-form',
  imports: [
    ReactiveFormsModule, RouterLink,
    ButtonModule, InputTextModule, InputMaskModule, SelectButtonModule,
    TextareaModule, MessageModule, CardModule, DividerModule, ToastModule, TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './client-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormComponent implements OnInit {
  private readonly svc        = inject(ClientsService);
  private readonly fb         = inject(FormBuilder);
  private readonly router     = inject(Router);
  private readonly route      = inject(ActivatedRoute);
  private readonly toast      = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly isEdit  = signal(false);
  readonly saving  = signal(false);
  readonly error   = signal('');
  private  clientId = '';

  readonly typeOptions = [
    { label: 'Pessoa Física',   value: 'individual' },
    { label: 'Pessoa Jurídica', value: 'company' },
  ];

  readonly form = this.fb.group({
    name:     ['', Validators.required],
    type:     ['individual'],
    cpfCnpj: [''],
    email:    ['', [Validators.email]],
    phone:    [''],
    phone2:   [''],
    notes:    [''],
  });

  private readonly clientType = toSignal(
    this.form.get('type')!.valueChanges,
    { initialValue: this.form.get('type')!.value as string },
  );

  readonly cpfCnpjMask = computed(() =>
    this.clientType() === 'company' ? '99.999.999/9999-99' : '999.999.999-99'
  );

  readonly cpfCnpjPlaceholder = computed(() =>
    this.clientType() === 'company' ? '00.000.000/0000-00' : '000.000.000-00'
  );

  readonly cpfCnpjLabel = computed(() =>
    this.clientType() === 'company' ? 'CNPJ' : 'CPF'
  );

  readonly namePlaceholder = computed(() =>
    this.clientType() === 'company' ? 'Razão social' : 'Nome completo'
  );

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit.set(!!this.clientId);
    this.breadcrumbSvc.set([
      { label: 'Clientes', routerLink: '/app/clientes' },
      { label: this.isEdit() ? 'Editar Cliente' : 'Novo Cliente' },
    ]);
    if (this.isEdit()) {
      this.svc.getOne(this.clientId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next:  (c) => this.form.patchValue(c as never),
        error: ()  => this.error.set('Erro ao carregar cliente.'),
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null && v !== ''),
    ) as Partial<Client>;
    const req = this.isEdit()
      ? this.svc.update(this.clientId, dto)
      : this.svc.create(dto);
    req.subscribe({
      next:  () => this.router.navigate(['/app/clientes']),
      error: ()  => {
        this.error.set('Erro ao salvar cliente.');
        this.saving.set(false);
      },
    });
  }
}
