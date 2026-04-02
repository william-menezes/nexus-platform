import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { SupplierEntity } from './entities/supplier.entity';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(SupplierEntity)
    private readonly repo: Repository<SupplierEntity>,
  ) {}

  findAll(tenantId: string, search?: string) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (search) where.name = ILike(`%${search}%`);
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(tenantId: string, id: string) {
    const s = await this.repo.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!s) throw new NotFoundException(`Fornecedor ${id} não encontrado`);
    return s;
  }

  create(tenantId: string, dto: CreateSupplierDto) {
    return this.repo.save({ ...dto, tenantId });
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as Partial<SupplierEntity>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }
}
