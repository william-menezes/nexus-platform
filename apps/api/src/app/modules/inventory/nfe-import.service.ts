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

    // Parse all items up-front, skip invalid dets
    const parsedItems = dets
      .map(det => {
        const prod = det.prod?.[0];
        if (!prod) return null;
        return {
          cProd: prod.cProd?.[0] ?? '',
          xProd: prod.xProd?.[0] ?? 'Produto sem nome',
          qty:   parseInt(prod.qCom?.[0]  ?? '1', 10) || 1,
          cost:  parseFloat(prod.vUnCom?.[0] ?? '0') || 0,
        };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null);

    if (parsedItems.length === 0) return { imported: 0 };

    // Load all matching products in one query instead of N individual lookups
    const cProds = [...new Set(parsedItems.map(i => i.cProd).filter(Boolean))];
    const existing = await this.products.find({
      where: cProds.map(cProd => ({ tenantId, externalRef: cProd, deletedAt: IsNull() })),
    });
    const productMap = new Map(existing.map(p => [p.externalRef, p]));

    // Batch-create missing products (deduplicated by cProd)
    const newDtos = parsedItems
      .filter((i, idx, arr) => i.cProd && !productMap.has(i.cProd) && arr.findIndex(x => x.cProd === i.cProd) === idx)
      .map(i => ({ tenantId, name: i.xProd, externalRef: i.cProd, costPrice: i.cost, salePrice: i.cost, minStock: 0, currentStock: 0 }));

    if (newDtos.length > 0) {
      const created = await this.products.save(newDtos);
      for (const p of created) productMap.set(p.externalRef!, p);
    }

    // Batch insert all stock entries in one save call
    const obs = `Importado via NF-e ${nfeNumber ?? ''}`.trim();
    await this.entries.save(
      parsedItems.map(i => ({
        tenantId,
        productId: productMap.get(i.cProd)!.id,
        type: 'in' as const,
        quantity: i.qty,
        nfeNumber,
        observation: obs,
      })),
    );

    return { imported: parsedItems.length };
  }

  private extractInfNFe(parsed: NfeParsed): NfeInfNFe | undefined {
    return (
      parsed?.NFe?.infNFe?.[0] ??
      parsed?.nfeProc?.NFe?.[0]?.infNFe?.[0]
    );
  }
}
