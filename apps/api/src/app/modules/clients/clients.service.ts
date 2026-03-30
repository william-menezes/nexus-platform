import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { ClientEntity } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repo: Repository<ClientEntity>,
  ) {}

  findAll(tenantId: string, search?: string) {
    const where: any = { tenantId, deletedAt: IsNull() };
    if (search) {
      return this.repo.find({
        where: [
          { ...where, name: ILike(`%${search}%`) },
          { ...where, cpfCnpj: ILike(`%${search}%`) },
          { ...where, email: ILike(`%${search}%`) },
          { ...where, phone: ILike(`%${search}%`) },
        ],
        order: { name: 'ASC' },
      });
    }
    return this.repo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.repo.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
    });
    if (!client) throw new NotFoundException(`Cliente ${id} não encontrado`);
    return client;
  }

  create(tenantId: string, dto: CreateClientDto) {
    return this.repo.save({ ...dto, tenantId });
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(tenantId, id);
    await this.repo.update({ id, tenantId }, dto as Partial<ClientEntity>);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }
}
