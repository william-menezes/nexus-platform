import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EquipmentTypeEntity } from './entities/equipment-type.entity';
import { EquipmentEntity } from './entities/equipment.entity';
import { CreateEquipmentTypeDto } from './dto/create-equipment-type.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';

@Injectable()
export class EquipmentsService {
  constructor(
    @InjectRepository(EquipmentTypeEntity)
    private readonly typeRepo: Repository<EquipmentTypeEntity>,
    @InjectRepository(EquipmentEntity)
    private readonly repo: Repository<EquipmentEntity>,
  ) {}

  // ── Types ──────────────────────────────────────────────────

  findAllTypes(tenantId: string) {
    return this.typeRepo.find({ where: { tenantId, deletedAt: IsNull() }, order: { name: 'ASC' } });
  }

  async findOneType(tenantId: string, id: string) {
    const t = await this.typeRepo.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!t) throw new NotFoundException(`Tipo de equipamento ${id} não encontrado`);
    return t;
  }

  createType(tenantId: string, dto: CreateEquipmentTypeDto) {
    return this.typeRepo.save({ ...dto, tenantId });
  }

  async updateType(tenantId: string, id: string, dto: Partial<CreateEquipmentTypeDto>) {
    await this.findOneType(tenantId, id);
    await this.typeRepo.update({ id, tenantId }, dto as Partial<EquipmentTypeEntity>);
    return this.findOneType(tenantId, id);
  }

  async removeType(tenantId: string, id: string) {
    await this.findOneType(tenantId, id);
    await this.typeRepo.softDelete({ id, tenantId });
  }

  // ── Equipments ─────────────────────────────────────────────

  findAll(tenantId: string, clientId?: string, typeId?: string) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (clientId) where.clientId = clientId;
    if (typeId) where.equipmentTypeId = typeId;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(tenantId: string, id: string) {
    const e = await this.repo.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!e) throw new NotFoundException(`Equipamento ${id} não encontrado`);
    return e;
  }

  create(tenantId: string, dto: CreateEquipmentDto) {
    return this.repo.save({ ...dto, tenantId });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateEquipmentDto>) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as Partial<EquipmentEntity>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }
}
