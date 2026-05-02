import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { isValidCpf, isValidCnpj } from '@nexus-platform/shared-utils';
import { ClientsService } from '../../clients.service';
import { BreadcrumbService } from '../../../../core/breadcrumb/breadcrumb.service';
import { ViaCepService } from '../../../../core/services/via-cep.service';
import { distinctUntilChanged, filter } from 'rxjs/operators';

// ── Local validators ──────────────────────────────────────────────────────────

const cpfValidator: ValidatorFn = (control: AbstractControl) =>
  control.value && !isValidCpf(control.value) ? { cpfInvalid: true } : null;

const cnpjValidator: ValidatorFn = (control: AbstractControl) =>
  control.value && !isValidCnpj(control.value) ? { cnpjInvalid: true } : null;

const stripDigits = (value: unknown) => String(value ?? '').replace(/\D/g, '');

const phoneValidator: ValidatorFn = (control: AbstractControl) => {
  const digits = stripDigits(control.value);
  return digits && !/^\d{10,11}$/.test(digits) ? { phoneInvalid: true } : null;
};

const zipCodeValidator: ValidatorFn = (control: AbstractControl) => {
  const digits = stripDigits(control.value);
  return digits && digits.length !== 8 ? { zipCodeInvalid: true } : null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  standalone: true,
  selector: 'app-client-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    InputMaskModule,
    IconFieldModule,
    InputIconModule,
    SelectButtonModule,
    TextareaModule,
    MessageModule,
    CardModule,
    DividerModule,
    ToastModule,
    TooltipModule,
    SelectModule,
    DatePickerModule,
    ToggleSwitchModule,
  ],
  providers: [MessageService],
  templateUrl: './client-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormComponent implements OnInit {
  private readonly svc = inject(ClientsService);
  private readonly viaCep = inject(ViaCepService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly breadcrumbSvc = inject(BreadcrumbService);

  readonly isEdit = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly cepLoading = signal(false);
  readonly cepError = signal(false);

  private clientId = '';

  readonly typeOptions = [
    { label: 'Pessoa Física', value: 'individual' },
    { label: 'Pessoa Jurídica', value: 'company' },
  ];

  readonly genderOptions = [
    { label: 'Masculino', value: 'M' },
    { label: 'Feminino', value: 'F' },
    { label: 'Outro', value: 'other' },
  ];

  readonly form = this.fb.group({
    name: ['', Validators.required, Validators.minLength(3)],
    type: ['individual'],
    cpf: ['', [cpfValidator]],
    cnpj: ['', [cnpjValidator]],
    email: ['', [Validators.email, Validators.pattern(emailPattern)]],
    phone: ['', [phoneValidator]],
    phone2: ['', [phoneValidator]],
    birthDate: [null as Date | null],
    gender: [null as string | null],
    notes: [''],
    hasAddress: [false],
    address: this.fb.group({
      zipCode: ['', [zipCodeValidator]],
      street: [''],
      number: [''],
      complement: [''],
      neighborhood: [''],
      city: [''],
      state: [''],
    }),
  });

  readonly clientType = toSignal(this.form.get('type')!.valueChanges, {
    initialValue: this.form.get('type')!.value as string,
  });

  readonly hasAddress = toSignal(this.form.get('hasAddress')!.valueChanges, {
    initialValue: false,
  });

  readonly namePlaceholder = () =>
    this.clientType() === 'company' ? 'Razão social' : 'Nome completo';

  isInvalid(path: string): boolean {
    const control = this.form.get(path);
    return !!control?.invalid && (control.touched || control.dirty);
  }

  phoneMask(path: 'phone' | 'phone2'): string {
    const digits = stripDigits(this.form.get(path)?.value);
    return digits.length > 10 ? '(99) 99999-9999' : '(99) 9999-9999';
  }

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit.set(!!this.clientId);
    this.breadcrumbSvc.set([
      { label: 'Clientes', routerLink: '/app/clientes' },
      { label: this.isEdit() ? 'Editar Cliente' : 'Novo Cliente' },
    ]);

    // CEP auto-fill
    this.form
      .get('address.zipCode')!
      .valueChanges.pipe(
        distinctUntilChanged(),
        filter((v) => /^\d{8}$/.test(stripDigits(v))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cep) => {
        this.cepLoading.set(true);
        this.cepError.set(false);
        this.viaCep.lookup(stripDigits(cep)).subscribe((res) => {
          this.cepLoading.set(false);
          if (!res) {
            this.cepError.set(true);
            return;
          }
          const addrGroup = this.form.get(
            'address',
          ) as import('@angular/forms').FormGroup;
          addrGroup.patchValue({
            street: res.logradouro,
            neighborhood: res.bairro,
            city: res.localidade,
            state: res.uf,
          });
        });
      });

    if (this.isEdit()) {
      this.svc
        .getOne(this.clientId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (c) => {
            const hasAddress = !!(
              c.address &&
              (c.address.street || c.address.city || c.address.zipCode)
            );
            this.form.patchValue({
              name: c.name,
              type: c.type,
              cpf: c.cpf ?? '',
              cnpj: c.cnpj ?? '',
              email: c.email ?? '',
              phone: c.phone ?? '',
              phone2: c.phone2 ?? '',
              birthDate: c.birthDate ? new Date(c.birthDate) : null,
              gender: c.gender ?? null,
              notes: c.notes ?? '',
              hasAddress,
              address: {
                zipCode: c.address?.zipCode ?? '',
                street: c.address?.street ?? '',
                number: c.address?.number ?? '',
                complement: c.address?.complement ?? '',
                neighborhood: c.address?.neighborhood ?? '',
                city: c.address?.city ?? '',
                state: c.address?.state ?? '',
              },
            });
          },
          error: () => this.error.set('Erro ao carregar cliente.'),
        });
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();

    // Build DTO: send cpf OR cnpj based on type, not both
    const dto: Partial<Client> = {
      name: raw.name ?? '',
      type: (raw.type ?? 'individual') as 'individual' | 'company',
      email: raw.email || undefined,
      phone: stripDigits(raw.phone) || undefined,
      phone2: stripDigits(raw.phone2) || undefined,
      notes: raw.notes || undefined,
      birthDate: raw.birthDate
        ? (raw.birthDate as Date).toISOString().split('T')[0]
        : undefined,
      gender: (raw.gender as 'M' | 'F' | 'other') || undefined,
    };

    if (raw.hasAddress) {
      dto.address = {
        zipCode: stripDigits(raw.address.zipCode) || undefined,
        street: raw.address.street || undefined,
        number: raw.address.number || undefined,
        complement: raw.address.complement || undefined,
        neighborhood: raw.address.neighborhood || undefined,
        city: raw.address.city || undefined,
        state: raw.address.state || undefined,
      } as any;
    } else {
      (dto as any).address = null;
    }

    if (raw.type === 'individual') {
      dto.cpf = stripDigits(raw.cpf) || undefined;
    } else {
      dto.cnpj = stripDigits(raw.cnpj) || undefined;
    }

    const req = this.isEdit()
      ? this.svc.update(this.clientId, dto)
      : this.svc.create(dto);

    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.router.navigate(['/app/clientes']),
      error: () => {
        this.error.set('Erro ao salvar cliente.');
        this.saving.set(false);
      },
    });
  }
}
