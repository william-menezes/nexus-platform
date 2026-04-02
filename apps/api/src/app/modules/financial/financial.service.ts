import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ChartOfAccountEntity } from './entities/chart-of-account.entity';
import { CostCenterEntity } from './entities/cost-center.entity';
import { FinancialEntryEntity } from './entities/financial-entry.entity';
import { InstallmentEntity } from './entities/installment.entity';
import { CashRegisterEntity } from './entities/cash-register.entity';
import { CashSessionEntity } from './entities/cash-session.entity';
import { CashMovementEntity } from './entities/cash-movement.entity';
import {
  CreateChartOfAccountDto,
  CreateCostCenterDto,
  CreateFinancialEntryDto,
  PayInstallmentDto,
  OpenCashSessionDto,
  CloseCashSessionDto,
  CreateCashMovementDto,
} from './dto/create-financial-entry.dto';

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(ChartOfAccountEntity)
    private readonly accountRepo: Repository<ChartOfAccountEntity>,
    @InjectRepository(CostCenterEntity)
    private readonly costCenterRepo: Repository<CostCenterEntity>,
    @InjectRepository(FinancialEntryEntity)
    private readonly entryRepo: Repository<FinancialEntryEntity>,
    @InjectRepository(InstallmentEntity)
    private readonly installmentRepo: Repository<InstallmentEntity>,
    @InjectRepository(CashRegisterEntity)
    private readonly registerRepo: Repository<CashRegisterEntity>,
    @InjectRepository(CashSessionEntity)
    private readonly sessionRepo: Repository<CashSessionEntity>,
    @InjectRepository(CashMovementEntity)
    private readonly movementRepo: Repository<CashMovementEntity>,
  ) {}

  // ── Chart of Accounts ─────────────────────────────────────

  findAccounts(tenantId: string) {
    return this.accountRepo.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { code: 'ASC' },
    });
  }

  createAccount(tenantId: string, dto: CreateChartOfAccountDto) {
    return this.accountRepo.save({ ...dto, tenantId });
  }

  async deleteAccount(tenantId: string, id: string) {
    const acc = await this.accountRepo.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!acc) throw new NotFoundException(`Conta ${id} não encontrada`);
    if (acc.isSystem) throw new BadRequestException('Conta de sistema não pode ser removida');
    await this.accountRepo.softDelete({ id, tenantId });
  }

  // ── Cost Centers ──────────────────────────────────────────

  findCostCenters(tenantId: string) {
    return this.costCenterRepo.find({ where: { tenantId, deletedAt: IsNull() }, order: { name: 'ASC' } });
  }

  createCostCenter(tenantId: string, dto: CreateCostCenterDto) {
    return this.costCenterRepo.save({ ...dto, tenantId });
  }

  async deleteCostCenter(tenantId: string, id: string) {
    const cc = await this.costCenterRepo.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!cc) throw new NotFoundException(`Centro de custo ${id} não encontrado`);
    await this.costCenterRepo.softDelete({ id, tenantId });
  }

  // ── Financial Entries ─────────────────────────────────────

  findEntries(tenantId: string, type?: string, status?: string, from?: string, to?: string) {
    const qb = this.entryRepo.createQueryBuilder('e')
      .where('e.tenant_id = :tenantId', { tenantId })
      .andWhere('e.deleted_at IS NULL')
      .orderBy('e.due_date', 'ASC');
    if (type)   qb.andWhere('e.type = :type', { type });
    if (status) qb.andWhere('e.status = :status', { status });
    if (from)   qb.andWhere('e.due_date >= :from', { from });
    if (to)     qb.andWhere('e.due_date <= :to', { to });
    return qb.getMany();
  }

  async findOneEntry(tenantId: string, id: string) {
    const e = await this.entryRepo.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
      relations: ['installments'],
    });
    if (!e) throw new NotFoundException(`Lançamento ${id} não encontrado`);
    return e;
  }

  async createEntry(tenantId: string, dto: CreateFinancialEntryDto) {
    const entry = await this.entryRepo.save({
      ...dto,
      tenantId,
      paidAmount: 0,
      status: 'pending',
    });

    const count = dto.installmentCount ?? 1;
    if (count > 1) {
      const installmentAmount = Math.round((dto.totalAmount / count) * 100) / 100;
      const baseDate = new Date(dto.dueDate);
      for (let i = 1; i <= count; i++) {
        const due = new Date(baseDate);
        due.setMonth(due.getMonth() + (i - 1));
        await this.installmentRepo.save({
          tenantId,
          financialEntryId: entry.id,
          installmentNumber: i,
          amount: i === count ? dto.totalAmount - installmentAmount * (count - 1) : installmentAmount,
          dueDate: due.toISOString().split('T')[0],
          paidAmount: 0,
          status: 'pending',
        });
      }
    }

    return this.findOneEntry(tenantId, entry.id);
  }

  async deleteEntry(tenantId: string, id: string) {
    await this.findOneEntry(tenantId, id);
    await this.entryRepo.softDelete({ id, tenantId });
  }

  // ── Installments ──────────────────────────────────────────

  async payInstallment(tenantId: string, installmentId: string, dto: PayInstallmentDto) {
    const inst = await this.installmentRepo.findOne({
      where: { tenantId, id: installmentId },
      relations: ['financialEntry'],
    });
    if (!inst) throw new NotFoundException(`Parcela ${installmentId} não encontrada`);

    await this.installmentRepo.update(
      { id: installmentId },
      { paidAmount: dto.paidAmount, paidAt: new Date(), status: 'paid', paymentMethod: dto.paymentMethod, notes: dto.notes },
    );

    // Update parent entry paidAmount
    const sibs = await this.installmentRepo.find({ where: { financialEntryId: inst.financialEntryId } });
    const totalPaid = sibs.reduce((s, x) => s + (x.id === installmentId ? dto.paidAmount : Number(x.paidAmount)), 0);
    const allPaid = sibs.every(x => x.id === installmentId ? true : x.status === 'paid');
    await this.entryRepo.update(
      { id: inst.financialEntryId },
      { paidAmount: totalPaid, status: allPaid ? 'paid' : totalPaid > 0 ? 'partial' : 'pending', paidAt: allPaid ? new Date() : undefined },
    );

    return this.installmentRepo.findOne({ where: { id: installmentId } });
  }

  // ── Cash Registers ────────────────────────────────────────

  findRegisters(tenantId: string) {
    return this.registerRepo.find({ where: { tenantId, isActive: true } });
  }

  createRegister(tenantId: string, name: string) {
    return this.registerRepo.save({ tenantId, name });
  }

  // ── Cash Sessions (RN10) ──────────────────────────────────

  getCurrentSession(tenantId: string) {
    return this.sessionRepo.findOne({ where: { tenantId, status: 'open' } });
  }

  async openSession(tenantId: string, userId: string, dto: OpenCashSessionDto) {
    const open = await this.getCurrentSession(tenantId);
    if (open) throw new BadRequestException('Já existe uma sessão de caixa aberta');
    return this.sessionRepo.save({
      ...dto,
      tenantId,
      openedBy: userId,
      status: 'open',
    });
  }

  async closeSession(tenantId: string, userId: string, dto: CloseCashSessionDto) {
    const session = await this.sessionRepo.findOne({ where: { tenantId, status: 'open' } });
    if (!session) throw new NotFoundException('Nenhuma sessão de caixa aberta');

    const movements = await this.movementRepo.find({ where: { cashSessionId: session.id } });
    const expectedAmount = Number(session.openingAmount) + movements.reduce((s, m) => {
      return ['sale', 'receipt'].includes(m.type) ? s + Number(m.amount) : s - Number(m.amount);
    }, 0);
    const difference = dto.closingAmount - expectedAmount;

    await this.sessionRepo.update({ id: session.id }, {
      closedBy: userId,
      closingAmount: dto.closingAmount,
      expectedAmount,
      difference,
      status: 'closed',
      closedAt: new Date(),
      notes: dto.notes,
    });
    return this.sessionRepo.findOne({ where: { id: session.id } });
  }

  async findSession(tenantId: string, sessionId: string) {
    const s = await this.sessionRepo.findOne({ where: { tenantId, id: sessionId } });
    if (!s) throw new NotFoundException(`Sessão ${sessionId} não encontrada`);
    const movements = await this.movementRepo.find({ where: { cashSessionId: sessionId }, order: { createdAt: 'ASC' } });
    return { ...s, movements };
  }

  async createMovement(tenantId: string, userId: string, dto: CreateCashMovementDto) {
    const session = await this.getCurrentSession(tenantId);
    if (!session) throw new BadRequestException('Nenhuma sessão de caixa aberta');
    return this.movementRepo.save({
      ...dto,
      tenantId,
      cashSessionId: session.id,
      createdBy: userId,
    });
  }
}
