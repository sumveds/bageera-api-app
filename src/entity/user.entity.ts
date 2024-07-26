import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('User')
export class User {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: number;

  @Column({ name: 'name', length: 150 })
  @IsNotEmpty()
  @MaxLength(150)
  @IsString()
  name: string;

  @Column({ name: 'email', length: 180 })
  @IsNotEmpty()
  @MaxLength(180)
  @IsEmail()
  email: string;

  @Column({ name: 'work_email', length: 180 })
  @MaxLength(180)
  @IsEmail()
  workEmail: string;

  @Column({ name: 'phone', length: 20 })
  @MaxLength(20)
  @IsPhoneNumber()
  phone: string;

  @Column({ name: 'job_title', length: 180 })
  @MaxLength(180)
  jobTitle: string;

  @Column({ name: 'company_website', length: 255 })
  @MaxLength(255)
  @IsUrl()
  companyWebsite: string;

  @Column({ name: 'company_size', length: 20 })
  @MaxLength(20)
  companySize: string;

  @Column({ name: 'alpha_opt_in', default: false })
  alphaOptIn: boolean;

  @Column({ name: 'professional_data_submitted', default: false })
  professionalDataSubmitted: boolean;

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
