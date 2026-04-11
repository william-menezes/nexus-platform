import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, IsNull, ILike, DataSource } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { EmployeeEntity } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InviteEmployeeDto } from './dto/invite-employee.dto';

@Injectable()
export class EmployeesService {
  private readonly supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly repo: Repository<EmployeeEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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

  async invite(tenantId: string, dto: InviteEmployeeDto) {
    // Check if this email already has a tenant_users entry for this tenant
    const existing = await this.dataSource.query<{ id: string }[]>(
      `SELECT tu.id FROM public.tenant_users tu
       JOIN auth.users au ON au.id = tu.user_id
       WHERE tu.tenant_id = $1 AND au.email = $2
       LIMIT 1`,
      [tenantId, dto.email],
    );
    if (existing.length) {
      throw new ConflictException('Este e-mail já possui acesso a este tenant');
    }

    // Invite user via Supabase Admin API
    const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(dto.email);
    if (error) throw new BadRequestException(`Erro ao convidar usuário: ${error.message}`);

    const userId = data.user.id;

    // Insert into tenant_users
    await this.dataSource.query(
      `INSERT INTO public.tenant_users (tenant_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = $3`,
      [tenantId, userId, dto.role],
    );

    // Link to employee record if provided
    if (dto.employeeId) {
      await this.dataSource.query(
        `UPDATE public.employees SET user_id = $1 WHERE id = $2 AND tenant_id = $3`,
        [userId, dto.employeeId, tenantId],
      );
    }

    return { userId, email: dto.email, role: dto.role };
  }
}
