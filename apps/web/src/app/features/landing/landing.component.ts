import { ChangeDetectionStrategy, Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

type BillingMode = 'monthly' | 'yearly';

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  highlight?: boolean;
  features: string[];
}

@Component({
  standalone: true,
  selector: 'app-landing',
  imports: [RouterLink, ButtonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent {
  // STATE
  readonly billing = signal<BillingMode>('monthly');

  // DATA
  readonly plans = signal<Plan[]>([
    {
      name: 'Starter',
      description: 'Para quem está começando',
      monthlyPrice: 29,
      yearlyPrice: 23,
      features: [
        'Até 30 ordens/mês',
        'Cadastro de clientes',
        'Estoque básico',
        'Relatórios simples'
      ]
    },
    {
      name: 'Pro',
      description: 'Para quem quer crescer',
      monthlyPrice: 59,
      yearlyPrice: 47,
      highlight: true,
      features: [
        'Ordens ilimitadas',
        'Estoque completo',
        'Financeiro completo',
        'Dashboard com indicadores',
        'Histórico completo'
      ]
    },
    {
      name: 'Premium',
      description: 'Para máxima organização',
      monthlyPrice: 99,
      yearlyPrice: 79,
      features: [
        'Tudo do Pro',
        'Multiusuários',
        'Permissões por usuário',
        'Relatórios avançados',
        'Suporte prioritário'
      ]
    }
  ]);

  // DERIVED STATE
  readonly isYearly = computed(() => this.billing() === 'yearly');

  readonly getPrice = (plan: Plan) =>
    this.billing() === 'monthly'
      ? plan.monthlyPrice
      : plan.yearlyPrice;

  setBilling(mode: BillingMode): void {
    this.billing.set(mode);
  }
}
