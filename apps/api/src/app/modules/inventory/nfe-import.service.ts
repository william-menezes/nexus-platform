import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { ProductEntity } from './entities/product.entity';
import { StockEntryEntity } from './entities/stock-entry.entity';

interface NfeProd {
  cProd?: string[];
  xProd?: string[];
  qCom?: string[];
  vUnCom?: string[];
}

interface NfeDet {
  prod?: NfeProd[];
}

interface NfeInfNFe {
  det?: NfeDet[];
  ide?: Array<{ nNF?: string[] }>;
}

interface NfeParsed {
  NFe?: { infNFe?: NfeInfNFe[] };
  nfeProc?: { NFe?: Array<{ infNFe?: NfeInfNFe[] }> };
}

@Injectable()
export class NfeImportService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(StockEntryEntity)
    private readonly entries: Repository<StockEntryEntity>,
  ) {}

  async importXml(tenantId: string, xml: string): Promise<{ imported: number }> {
    let parsed: NfeParsed;
    try {
      parsed = await parseStringPromise(xml, { explicitArray: true }) as NfeParsed;
    } catch {
      throw new BadRequestException('XML de NF-e inválido ou malformado.');
    }

    const infNFe = this.extractInfNFe(parsed);
    if (!infNFe) {
      throw new BadRequestException('Estrutura de NF-e não reconhecida no XML.');
    }

    const dets = infNFe.det ?? [];
    if (!dets.length) {
      throw new BadRequestException('Nenhum item (det) encontrado na NF-e.');
    }

    const nfeNumber = infNFe.ide?.[0]?.nNF?.[0];
    let imported = 0;

    for (const det of dets) {
      const prod = det.prod?.[0];
      if (!prod) continue;

      const cProd = prod.cProd?.[0] ?? '';
      const xProd = prod.xProd?.[0] ?? 'Produto sem nome';
      const qty   = parseInt(prod.qCom?.[0] ?? '1', 10) || 1;
      const cost  = parseFloat(prod.vUnCom?.[0] ?? '0') || 0;

      let product = await this.products.findOne({
        where: { tenantId, externalRef: cProd, deletedAt: IsNull() },
      });

      if (!product) {
        product = await this.products.save({
          tenantId,
          name: xProd,
          externalRef: cProd,
          costPrice: cost,
          salePrice: cost,
          minStock: 0,
          currentStock: 0,
        });
      }

      await this.entries.save({
        tenantId,
        productId: product.id,
        type: 'in' as const,
        quantity: qty,
        nfeNumber,
        observation: `Importado via NF-e ${nfeNumber ?? ''}`.trim(),
      });

      imported++;
    }

    return { imported };
  }

  private extractInfNFe(parsed: NfeParsed): NfeInfNFe | undefined {
    return (
      parsed?.NFe?.infNFe?.[0] ??
      parsed?.nfeProc?.NFe?.[0]?.infNFe?.[0]
    );
  }
}
