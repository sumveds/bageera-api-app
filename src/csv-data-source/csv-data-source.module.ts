import { Module } from '@nestjs/common';
import { CsvDataSourceService } from './csv-data-source.service';
import { CsvDataSourceController } from './csv-data-source.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from 'src/entity/table.entity';
import { UserService } from 'src/user/user.service';
import { User } from 'src/entity/user.entity';
import { HttpModule } from '@nestjs/axios';
import {
  EXT_API_MAX_REDIRECTS,
  EXT_API_RESPONSE_TIMEOUT,
} from 'src/utils/constants/constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Table]),
    HttpModule.register({
      timeout: EXT_API_RESPONSE_TIMEOUT,
      maxRedirects: EXT_API_MAX_REDIRECTS,
    }),
  ],
  controllers: [CsvDataSourceController],
  providers: [CsvDataSourceService, UserService],
})
export class CsvDataSourceModule {}
