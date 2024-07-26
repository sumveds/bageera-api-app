import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEnum, IsNotEmpty, MaxLength } from 'class-validator';

export enum DATA_WAREHOUSE {
  BIGQUERY = 'bigquery',
}

@Entity('view')
export class View {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'config_id', type: 'bigint' })
  configId: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @Column({ name: 'alias', type: 'varchar', length: 180 })
  @IsNotEmpty()
  @MaxLength(180)
  alias: string;

  @Column({ name: 'warehouse' })
  @IsNotEmpty()
  @IsEnum(['bigquery'])
  warehouse: string;

  @Column({ name: 'database', type: 'varchar', length: 120 })
  @IsNotEmpty()
  database: string;

  @Column({ name: 'schema', type: 'json' })
  schema: any;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}
