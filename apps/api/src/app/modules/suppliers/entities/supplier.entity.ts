import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('suppliers')
export class SupplierEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column() name: string;
  @Column({ nullable: true }) cnpj?: string;
  @Column({ nullable: true }) contact?: string;
  @Column({ nullable: true }) phone?: string;
  @Column({ nullable: true }) email?: string;
  @Column('jsonb', { default: {} }) address: Record<string, unknown>;
  @Column({ nullable: true }) notes?: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
