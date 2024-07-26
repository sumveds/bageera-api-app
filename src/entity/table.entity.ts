import { IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';

@Entity('Table')
export class Table {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id?: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  uuid: string;

  @Column({ name: 'name' })
  @IsNotEmpty()
  @MaxLength(180)
  name: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt?: Date;
}
