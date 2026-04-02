import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { EmployeeEntity } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly repo: Repository<EmployeeEntity>,
  ) {}

  findAll(tenantId: string, search?: string, activeOnly?: boolean) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (activeOnly) where.isActive = true;
    if (search) where.name = ILike(`%${search}%`);
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(tenantId: string, id: string) {
    const e = await this.repo.findOne({ where: { tenantId, id, deletedAt: IsNull() } });
    if (!e) throw new NotFoundException(`Funcionário ${id} não encontrado`);
    return e;
  }

  create(tenantId: string, dto: CreateEmployeeDto) {
    return this.repo.save({ ...dto, tenantId });
  }

  async update(tenantId: string, id: string, dto: UpdateEmployeeDto) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as Partial<EmployeeEntity>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }
}
