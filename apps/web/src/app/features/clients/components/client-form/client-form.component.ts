import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';
import { Client } from '@nexus-platform/shared-types';
import { ClientsService } from '../../clients.service';

@Component({
  standalone: true,
  selector: 'app-client-form',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, SelectButtonModule, MessageModule],
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {
  private readonly svc    = inject(ClientsService);
  private readonly fb     = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  isEdit = false;
  clientId = '';
  saving = false;
  error = '';

  readonly typeOptions = [
    { label: 'Pessoa Física', value: 'individual' },
    { label: 'Pessoa Jurídica', value: 'company' },
  ];

  form = this.fb.group({
    name:     ['', Validators.required],
    type:     ['individual'],
    cpfCnpj: [''],
    email:   [''],
    phone:   [''],
    phone2:  [''],
    notes:   [''],
  });

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit = !!this.clientId;
    if (this.isEdit) {
      this.svc.getOne(this.clientId).subscribe({
        next: (c) => this.form.patchValue(c as any),
        error: () => { this.error = 'Erro ao carregar cliente.'; },
      });
    }
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    const raw = this.form.getRawValue();
    const dto = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null),
    ) as Partial<Client>;
    const req = this.isEdit
      ? this.svc.update(this.clientId, dto)
      : this.svc.create(dto);
    req.subscribe({
      next: () => this.router.navigate(['/app/clientes']),
      error: () => { this.error = 'Erro ao salvar cliente.'; this.saving = false; },
    });
  }
}
