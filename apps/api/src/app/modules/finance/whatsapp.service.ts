import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly instance: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl   = config.get<string>('EVOLUTION_API_URL', '');
    this.apiKey   = config.get<string>('EVOLUTION_API_KEY', '');
    this.instance = config.get<string>('WHATSAPP_INSTANCE', 'default');
  }

  async sendMessage(phone: string, text: string): Promise<boolean> {
    if (!this.apiUrl || !this.apiKey) {
      this.logger.warn('Evolution API não configurada — mensagem não enviada.');
      return false;
    }

    // Normaliza número: remove caracteres não numéricos, adiciona código do Brasil
    const number = phone.replace(/\D/g, '');
    const to = number.startsWith('55') ? number : `55${number}`;

    try {
      const res = await fetch(
        `${this.apiUrl}/message/sendText/${this.instance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.apiKey,
          },
          body: JSON.stringify({ number: `${to}@s.whatsapp.net`, text }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`WhatsApp error ${res.status}: ${body}`);
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error('WhatsApp request failed', err);
      return false;
    }
  }

  buildOsCompletedMessage(clientName: string, osCode: string): string {
    return (
      `Olá, ${clientName}! 👋\n` +
      `Sua ordem de serviço *${osCode}* foi concluída.\n` +
      `Entre em contato para retirar seu equipamento. Obrigado!`
    );
  }
}
