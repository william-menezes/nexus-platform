import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InventoryService } from '../../inventory.service';

@Component({
  standalone: true,
  selector: 'app-nfe-import',
  imports: [RouterLink, ButtonModule, CardModule, MessageModule, ProgressSpinnerModule],
  templateUrl: './nfe-import.component.html',
})
export class NfeImportComponent {
  private readonly svc    = inject(InventoryService);
  private readonly router = inject(Router);

  file: File | null = null;
  fileName = '';
  loading = false;
  result: { imported: number } | null = null;
  error = '';

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file     = input.files?.[0] ?? null;
    this.fileName = this.file?.name ?? '';
    this.result   = null;
    this.error    = '';
  }

  import() {
    if (!this.file) return;
    this.loading = true;
    this.svc.importNfe(this.file).subscribe({
      next: (res) => { this.result = res; this.loading = false; },
      error: (err) => {
        this.error = err?.error?.message ?? 'Erro ao importar NF-e.';
        this.loading = false;
      },
    });
  }

  goBack() {
    void this.router.navigate(['/app/estoque']);
  }
}
