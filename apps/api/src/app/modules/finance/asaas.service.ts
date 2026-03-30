import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AsaasChargeRequest {
  customer: string;  // ID do cliente no Asaas
  value: number;
  dueDate: string;   // 'YYYY-MM-DD'
  description?: string;
}

export interface AsaasChargeResponse {
  id: string;
  invoiceUrl: string;
  bankSlipUrl: string;
  status: string;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('ASAAS_BASE_URL', 'https://sandbox.asaas.com/api/v3');
    this.apiKey  = config.get<string>('ASAAS_API_KEY', '');
  }

  async createBoletoCharge(req: AsaasChargeRequest): Promise<AsaasChargeResponse | null> {
    if (!this.apiKey) {
      this.logger.warn('ASAAS_API_KEY não configurado — cobrança não enviada.');
      return null;
    }

    try {
      const res = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': this.apiKey,
        },
        body: JSON.stringify({ ...req, billingType: 'BOLETO' }),
      });

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Asaas error ${res.status}: ${body}`);
        return null;
      }

      return res.json() as Promise<AsaasChargeResponse>;
    } catch (err) {
      this.logger.error('Asaas request failed', err);
      return null;
    }
  }
}
