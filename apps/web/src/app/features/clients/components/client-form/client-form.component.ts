import { Component, OnInit, inject, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService, MenuItem } from 'primeng/api';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';

@Component({
  standalone: true,
  selector: 'app-client-form',
  imports: [
    ReactiveFormsModule, RouterLink,
    ButtonModule, InputTextModule, InputMaskModule, SelectButtonModule,
    TextareaModule, MessageModule, CardModule, BreadcrumbModule, DividerModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {
  private readonly svc     = inject(ClientsService);
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);
  private readonly toast   = inject(MessageService);

  isEdit   = false;
  clientId = '';
  saving   = false;
  error    = '';

  readonly typeOptions = [
    { label: 'Pessoa Física',   value: 'individual' },
    { label: 'Pessoa Jurídica', value: 'company' },
  ];

  form = this.fb.group({
    name:    ['', Validators.required],
    type:    ['individual'],
    cpfCnpj:[''],
    email:   ['', [Validators.email]],
    phone:   [''],
    phone2:  [''],
    notes:   [''],
  });

  get breadcrumbs(): MenuItem[] {
    return [
      { label: 'Clientes', routerLink: '/app/clientes' },
      { label: this.isEdit ? 'Editar Cliente' : 'Novo Cliente' },
    ];
  }
  readonly homeItem: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };

  /** Máscara dinâmica: CPF para PF, CNPJ para PJ */
  get cpfCnpjMask(): string {
    return this.form.get('type')?.value === 'company'
      ? '99.999.999/9999-99'
      : '999.999.999-99';
  }

  get cpfCnpjPlaceholder(): string {
    return this.form.get('type')?.value === 'company'
      ? '00.000.000/0000-00'
      : '000.000.000-00';
  }

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit   = !!this.clientId;
    if (this.isEdit) {
      this.svc.getOne(this.clientId).subscribe({
        next:  (c) => this.form.patchValue(c as never),
        error: ()  => { this.error = 'Erro ao carregar cliente.'; },
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null && v !== ''),
    ) as Partial<Client>;
    const req = this.isEdit
      ? this.svc.update(this.clientId, dto)
      : this.svc.create(dto);
    req.subscribe({
      next:  () => this.router.navigate(['/app/clientes']),
      error: ()  => {
        this.error  = 'Erro ao salvar cliente.';
        this.saving = false;
      },
    });
  }
}
