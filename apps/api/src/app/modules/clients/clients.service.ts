import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { ClientEntity } from './entities/client.entity';
import { AddressEntity } from './entities/address.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ServiceOrderEntity } from '../service-orders/entities/service-order.entity';
import { QuoteEntity } from '../quotes/entities/quote.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repo: Repository<ClientEntity>,
    @InjectRepository(AddressEntity)
    private readonly addressRepo: Repository<AddressEntity>,
    @InjectRepository(ServiceOrderEntity)
    private readonly soRepo: Repository<ServiceOrderEntity>,
    @InjectRepository(QuoteEntity)
    private readonly quoteRepo: Repository<QuoteEntity>,
  ) {}

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenantId, deletedAt: IsNull() };
    let clients: ClientEntity[];

    if (search) {
      clients = await this.repo.find({
        where: [
          { ...where, name: ILike(`%${search}%`) },
          { ...where, cpfCnpj: ILike(`%${search}%`) },
          { ...where, email: ILike(`%${search}%`) },
          { ...where, phone: ILike(`%${search}%`) },
        ],
        order: { name: 'ASC' },
        take: 20,
      });
    } else {
      clients = await this.repo.find({ where, order: { name: 'ASC' } });
    }

    return clients.map((client) => this.toResponse(client));
  }

  async findOne(tenantId: string, id: string) {
    const client = await this.repo.findOne({
      where: { tenantId, id, deletedAt: IsNull() },
      relations: ['address'],
    });
    if (!client) throw new NotFoundException(`Cliente ${id} não encontrado`);
    return this.toResponse(client);
  }

  async create(tenantId: string, dto: CreateClientDto) {
    const { address: addressData, ...clientData } = dto;
    let addressId: string | undefined;

    if (addressData && typeof addressData === 'object') {
      const saved = await this.addressRepo.save({ ...addressData, tenantId });
      addressId = saved.id;
    }

    const saved = await this.repo.save({
      ...this.toEntityData(clientData),
      tenantId,
      addressId,
    });
    return this.toResponse(saved);
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto) {
    const existing = await this.findOne(tenantId, id);
    const { address: addressData, ...clientData } = dto as any;

    let addressId = (existing as any).addressId ?? existing.address?.id;

    if (addressData === null) {
      if (addressId) {
        await this.addressRepo.delete(addressId);
        addressId = undefined;
      }
    } else if (addressData && typeof addressData === 'object') {
      if (addressId) {
        await this.addressRepo.update(addressId, addressData);
      } else {
        const saved = await this.addressRepo.save({ ...addressData, tenantId });
        addressId = saved.id;
      }
    }

    await this.repo.update(
      { id, tenantId },
      { ...this.toEntityData(clientData), addressId } as any,
    );
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.repo.softDelete({ id, tenantId });
  }

  async getHistory(tenantId: string, clientId: string) {
    await this.findOne(tenantId, clientId);

    const [rawOrders, rawQuotes] = await Promise.all([
      this.soRepo.find({
        where: { tenantId, clientId, deletedAt: IsNull() },
        select: ['id', 'code', 'status', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 50,
      }),
      this.quoteRepo.find({
        where: { tenantId, clientId, deletedAt: IsNull() },
        select: ['id', 'code', 'createdAt'],
        order: { createdAt: 'DESC' },
        take: 50,
      }),
    ]);

    return {
      serviceOrders: rawOrders.map((o) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        createdAt: o.createdAt,
        type: 'os' as const,
      })),
      quotes: rawQuotes.map((q) => ({
        id: q.id,
        code: q.code,
        status: '—',
        createdAt: q.createdAt,
        type: 'quote' as const,
      })),
    };
  }

  private toEntityData(dto: Partial<CreateClientDto | UpdateClientDto>) {
    const { cpf, cnpj, ...data } = dto as any;
    const entityData = { ...data };

    if ('cpf' in dto || 'cnpj' in dto || 'type' in dto) {
      entityData.cpfCnpj = data.type === 'company' ? cnpj : cpf;
    }

    return entityData;
  }

  private toResponse(client: ClientEntity) {
    const cpf = client.type === 'individual' ? client.cpfCnpj : undefined;
    const cnpj = client.type === 'company' ? client.cpfCnpj : undefined;
    return { ...client, cpf, cnpj };
  }
}
