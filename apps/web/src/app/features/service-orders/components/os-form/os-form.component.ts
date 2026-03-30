import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageModule } from 'primeng/message';
import { ServiceOrdersService } from '../../service-orders.service';

@Component({
  standalone: true,
  selector: 'app-os-form',
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, TextareaModule, InputNumberModule, MessageModule],
  templateUrl: './os-form.component.html',
})
export class OsFormComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly svc     = inject(ServiceOrdersService);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);

  editId: string | null = null;
  submitting = false;
  error = '';

  form = this.fb.group({
    clientName:   ['', Validators.required],
    clientPhone:  [''],
    description:  ['', Validators.required],
    priceIdeal:   [null as number | null],
  });

  get isEdit() { return !!this.editId; }

  ngOnInit() {
    this.editId = this.route.snapshot.paramMap.get('id');
    if (this.editId) {
      this.svc.getOne(this.editId).subscribe({
        next: (os) => this.form.patchValue(os as never),
        error: () => this.error = 'OS não encontrada.',
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting = true;
    const dto = this.form.value;
    const req = this.editId
      ? this.svc.update(this.editId, dto as never)
      : this.svc.create(dto as never);

    req.subscribe({
      next: () => this.router.navigate(['/app/os']),
      error: () => { this.error = 'Erro ao salvar OS.'; this.submitting = false; },
    });
  }
}
