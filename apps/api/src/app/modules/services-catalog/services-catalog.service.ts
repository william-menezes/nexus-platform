import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { ServiceCatalogEntity } from './entities/service-catalog.entity';
import { CreateServiceCatalogDto } from './dto/create-service-catalog.dto';
import { UpdateServiceCatalogDto } from './dto/update-service-catalog.dto';

@Injectable()
export class ServicesCatalogService {
  constructor(
    @InjectRepository(ServiceCatalogEntity)
    private readonly repo: Repository<ServiceCatalogEntity>,
  ) {}

  findAll(tenantId: string, search?: string) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (search) where.name = ILike(`%${search}%`);
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(tenantId: string, id: string) {
    const s = await this.repo.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!s) throw new NotFoundException(`Serviço ${id} não encontrado`);
    return s;
  }

  create(tenantId: string, dto: CreateServiceCatalogDto) {
    return this.repo.save({ ...dto, tenantId });
  }

  async update(tenantId: string, id: string, dto: UpdateServiceCatalogDto) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as Partial<ServiceCatalogEntity>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }
}
