import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { AddressEntity } from './address.entity';

@Entity('clients')
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column()
  name: string;

  @Column({ default: 'individual' })
  type: 'individual' | 'company';

  @Column({ nullable: true, name: 'cpf_cnpj' })
  cpfCnpj?: string;

  cpf?: string;

  cnpj?: string;

  @Column({ type: 'date', nullable: true })
  birthDate?: string;

  @Column({ nullable: true })
  gender?: 'M' | 'F' | 'other';

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  phone2?: string;

  @Column({ type: 'uuid', nullable: true, name: 'address_id' })
  addressId?: string;

  @ManyToOne(() => AddressEntity, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'address_id' })
  address?: AddressEntity;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
