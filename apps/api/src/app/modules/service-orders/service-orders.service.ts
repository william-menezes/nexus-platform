import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceOrderEntity } from './entities/service-order.entity';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto, ChangeStatusDto } from './dto/update-service-order.dto';

const PLAN_LIMITS: Record<string, number> = {
  starter: 100,
  pro: 1000,
  enterprise: Infinity,
};

@Injectable()
export class ServiceOrdersService {
  constructor(
    @InjectRepository(ServiceOrderEntity)
    private readonly repo: Repository<ServiceOrderEntity>,
  ) {}

  findAll(tenantId: string) {
    return this.repo.find({
      where: { tenantId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const os = await this.repo.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
    });
    if (!os) throw new NotFoundException(`OS ${id} não encontrada`);
    return os;
  }

  async create(tenantId: string, dto: CreateServiceOrderDto) {
    const count = await this.repo.count({
      where: { tenantId, deletedAt: IsNull() },
    });
    const limit = PLAN_LIMITS['starter'];
    if (count >= limit) {
      throw new HttpException(
        {
          message: `Limite de ${limit} OS atingido. Faça upgrade do plano.`,
          upgradeUrl: '/pricing',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    const code = `OS-${Date.now().toString(36).toUpperCase()}`;
    return this.repo.save({ ...dto, tenantId, code });
  }

  async update(tenantId: string, id: string, dto: UpdateServiceOrderDto) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as unknown as Partial<ServiceOrderEntity>);
    return this.findOne(tenantId, id);
  }

  async changeStatus(tenantId: string, id: string, dto: ChangeStatusDto) {
    await this.findOne(tenantId, id);
    const patch: Partial<ServiceOrderEntity> = {};
    if (dto.statusId) patch.statusId = dto.statusId;
    if (dto.status)   patch.status   = dto.status as ServiceOrderEntity['status'];
    await this.repo.update({ id, tenantId }, patch);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }
}
