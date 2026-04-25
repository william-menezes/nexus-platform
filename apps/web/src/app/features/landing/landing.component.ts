import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
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

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

interface FAQ {
  question: string;
  answer: string;
}

@Component({
  standalone: true,
  selector: 'app-landing',
  imports: [RouterLink, ButtonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  readonly billing = signal<BillingMode>('monthly');
  readonly isYearly = computed(() => this.billing() === 'yearly');
  readonly openFaq = signal<number | null>(null);

  readonly features = signal<Feature[]>([
    {
      icon: 'pi pi-file-edit',
      title: 'Ordens de Serviço',
      desc: 'Crie, acompanhe e encerre OS com status personalizados, histórico completo e vinculação de equipamentos.',
    },
    {
      icon: 'pi pi-box',
      title: 'Controle de Estoque',
      desc: 'Alertas de estoque mínimo, entradas e saídas, importação de NF-e. Nunca mais fique sem peças.',
    },
    {
      icon: 'pi pi-chart-line',
      title: 'Financeiro Completo',
      desc: 'Contas a pagar/receber, controle de caixa, DRE e fluxo de caixa em tempo real.',
    },
    {
      icon: 'pi pi-users',
      title: 'Gestão de Clientes',
      desc: 'Cadastro completo com histórico de atendimentos, equipamentos e comunicação por WhatsApp.',
    },
    {
      icon: 'pi pi-file',
      title: 'Orçamentos Profissionais',
      desc: 'Envie orçamentos com aprovação digital e conversão automática em ordem de serviço.',
    },
    {
      icon: 'pi pi-shield',
      title: 'Seguro e Confiável',
      desc: 'Dados na nuvem com backup diário, criptografia SSL e acesso de qualquer dispositivo.',
    },
  ]);

  readonly plans = signal<Plan[]>([
    {
      name: 'Starter',
      description: 'Para quem está começando',
      monthlyPrice: 29,
      yearlyPrice: 23,
      features: [
        'Até 100 ordens/mês',
        '3 usuários',
        'Cadastro de clientes',
        'Estoque básico',
        'Relatórios simples',
      ],
    },
    {
      name: 'Pro',
      description: 'Para quem quer crescer',
      monthlyPrice: 59,
      yearlyPrice: 47,
      highlight: true,
      features: [
        'Ordens ilimitadas',
        '10 usuários',
        'Estoque completo',
        'Financeiro completo',
        'Dashboard com indicadores',
        'Suporte prioritário',
      ],
    },
    {
      name: 'Premium',
      description: 'Para máxima organização',
      monthlyPrice: 99,
      yearlyPrice: 79,
      features: [
        'Tudo do Pro',
        'Usuários ilimitados',
        'Permissões por usuário',
        'Relatórios avançados',
        'API de integração',
        'Suporte dedicado',
      ],
    },
  ]);

  readonly faqs = signal<FAQ[]>([
    {
      question: 'Preciso instalar algum programa?',
      answer:
        'Não. O SimplificaOS funciona 100% no navegador, sem instalação. Acesse de qualquer computador, tablet ou celular.',
    },
    {
      question: 'Posso experimentar antes de assinar?',
      answer:
        'Sim! Oferecemos 7 dias de teste gratuito com acesso completo a todos os recursos, sem precisar de cartão de crédito.',
    },
    {
      question: 'O sistema funciona no celular?',
      answer:
        'Sim, o SimplificaOS é totalmente responsivo. Abra e gerencie ordens de serviço direto do smartphone.',
    },
    {
      question: 'Posso cancelar quando quiser?',
      answer:
        'Sim. Não há fidelidade nem multa. Você pode cancelar a assinatura a qualquer momento, de forma simples e rápida.',
    },
    {
      question: 'Como funciona o controle financeiro?',
      answer:
        'O módulo financeiro permite gerenciar contas a pagar e receber, controle de caixa, DRE e geração de relatórios por período.',
    },
  ]);

  readonly getPrice = (plan: Plan) =>
    this.billing() === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

  setBilling(mode: BillingMode): void {
    this.billing.set(mode);
  }

  toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }
}
