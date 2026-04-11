import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { ContractEntity } from './entities/contract.entity';
import { ContractBillingEntity } from './entities/contract-billing.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(ContractEntity)
    private readonly repo: Repository<ContractEntity>,
    @InjectRepository(ContractBillingEntity)
    private readonly billingRepo: Repository<ContractBillingEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findAll(tenantId: string, filters?: { status?: string; clientId?: string }) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(tenantId: string, id: string) {
    const contract = await this.repo.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
      relations: ['billings'],
    });
    if (!contract) throw new NotFoundException(`Contrato ${id} não encontrado`);
    return contract;
  }

  async create(tenantId: string, dto: CreateContractDto) {
    this.validateByType(dto);
    const code = `CTR-${Date.now().toString(36).toUpperCase()}`;
    const nextBillingAt = this.calcNextBillingAt(dto.startDate, dto.billingDay ?? 1);
    const contract = this.repo.create({
      ...dto,
      tenantId,
      code,
      billingDay: dto.billingDay ?? 1,
      adjustmentRate: dto.adjustmentRate ?? 0,
      nextBillingAt,
    });
    return this.repo.save(contract);
  }

  async update(tenantId: string, id: string, dto: UpdateContractDto) {
    await this.findOne(tenantId, id);
    if (dto.type) this.validateByType(dto as CreateContractDto);
    await this.repo.update({ id, tenantId }, dto as Partial<ContractEntity>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }

  async activate(tenantId: string, id: string) {
    const contract = await this.findOne(tenantId, id);
    if (contract.status !== 'draft') {
      throw new BadRequestException('Apenas contratos em rascunho podem ser ativados');
    }
    const nextBillingAt = this.calcNextBillingAt(contract.startDate, contract.billingDay);
    await this.repo.update({ id, tenantId }, { status: 'active', nextBillingAt });
    return this.findOne(tenantId, id);
  }

  async suspend(tenantId: string, id: string) {
    const contract = await this.findOne(tenantId, id);
    if (contract.status !== 'active') {
      throw new BadRequestException('Apenas contratos ativos podem ser suspensos');
    }
    await this.repo.update({ id, tenantId }, { status: 'suspended' });
    return this.findOne(tenantId, id);
  }

  async cancel(tenantId: string, id: string) {
    const contract = await this.findOne(tenantId, id);
    if (['cancelled', 'expired'].includes(contract.status)) {
      throw new BadRequestException('Contrato já está cancelado ou expirado');
    }
    await this.repo.update({ id, tenantId }, { status: 'cancelled' });
    return this.findOne(tenantId, id);
  }

  async generateBilling(tenantId: string, id: string) {
    const contract = await this.findOne(tenantId, id);
    if (contract.status !== 'active') {
      throw new BadRequestException('Faturamento só pode ser gerado para contratos ativos');
    }

    const periodStart = contract.nextBillingAt
      ? this.startOfMonth(contract.nextBillingAt)
      : this.startOfMonth(new Date());
    const periodEnd = this.endOfMonth(periodStart);

    let baseAmount = 0;
    let excessHours = 0;
    let excessAmount = 0;

    if (contract.type === 'fixed') {
      baseAmount = Number(contract.monthlyValue ?? 0);
    } else {
      // hourly_franchise: calcular horas usadas no período via so_time_entries
      const [hoursRow] = await this.dataSource.query<{ total_minutes: string }[]>(
        `SELECT COALESCE(SUM(duration_minutes), 0) AS total_minutes
         FROM public.so_time_entries ste
         JOIN public.service_orders so ON so.id = ste.service_order_id
         WHERE so.contract_id = $1
           AND ste.started_at BETWEEN $2 AND $3`,
        [id, periodStart.toISOString(), periodEnd.toISOString()],
      );
      const usedHours = Number(hoursRow?.total_minutes ?? 0) / 60;
      const franchise = Number(contract.franchiseHours ?? 0);
      baseAmount = franchise * (Number(contract.hourExcessPrice ?? 0));
      if (usedHours > franchise) {
        excessHours = usedHours - franchise;
        excessAmount = excessHours * Number(contract.hourExcessPrice ?? 0);
      }
    }

    const totalAmount = baseAmount + excessAmount;
    const billing = this.billingRepo.create({
      tenantId,
      contractId: id,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      baseAmount,
      excessHours,
      excessAmount,
      totalAmount,
    });
    await this.billingRepo.save(billing);

    // Avançar próximo ciclo de faturamento
    const nextBillingAt = this.calcNextBillingAt(
      periodEnd.toISOString().split('T')[0],
      contract.billingDay,
    );
    await this.repo.update({ id, tenantId }, { nextBillingAt });

    return billing;
  }

  findBillingHistory(tenantId: string, contractId: string) {
    return this.billingRepo.find({
      where: { tenantId, contractId },
      order: { createdAt: 'DESC' },
    });
  }

  private validateByType(dto: CreateContractDto) {
    if (dto.type === 'fixed' && !dto.monthlyValue) {
      throw new BadRequestException('monthlyValue é obrigatório para contratos do tipo "fixed"');
    }
    if (dto.type === 'hourly_franchise' && (!dto.franchiseHours || !dto.hourExcessPrice)) {
      throw new BadRequestException('franchiseHours e hourExcessPrice são obrigatórios para contratos do tipo "hourly_franchise"');
    }
  }

  private calcNextBillingAt(fromDate: string, billingDay: number): Date {
    const d = new Date(fromDate);
    // Avança para o próximo mês e define o dia de faturamento
    const next = new Date(d.getFullYear(), d.getMonth() + 1, billingDay, 12, 0, 0);
    return next;
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  }

  private endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  }
}
