import { IsString } from 'class-validator';

export class BigQueryConfigDto {
  @IsString()
  readonly projectId: string;
}
