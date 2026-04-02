import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('equipments')
export class EquipmentEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column('uuid') equipmentTypeId: string;
  @Column('uuid', { nullable: true }) clientId?: string;
  @Column({ nullable: true }) brand?: string;
  @Column({ nullable: true }) model?: string;
  @Column('jsonb', { default: {} }) fieldsData: Record<string, unknown>;
  @Column({ nullable: true }) notes?: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
