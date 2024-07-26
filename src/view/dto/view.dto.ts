import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class ViewDto {
  @IsNotEmpty()
  readonly config: { id: number };

  @IsString()
  readonly name: string;

  @IsString()
  readonly alias: string;

  @IsEnum(['bigquery'])
  readonly warehouse: string;

  @IsString()
  readonly database: string;

  @IsString()
  readonly query: string;
}
