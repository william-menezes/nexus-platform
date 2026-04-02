import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('employees')
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tenantId: string;
  @Column('uuid', { nullable: true }) userId?: string;
  @Column() name: string;
  @Column({ nullable: true }) roleLabel?: string;
  @Column({ nullable: true }) phone?: string;
  @Column({ nullable: true }) email?: string;
  @Column('numeric', { precision: 5, scale: 2, default: 0 }) commissionRate: number;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
