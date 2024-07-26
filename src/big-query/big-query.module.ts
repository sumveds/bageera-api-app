import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from 'src/user/user.service';
import { BigQueryService } from './big-query.service';
import { BigQueryController } from './big-query.controller';
import {
  EXT_API_MAX_REDIRECTS,
  EXT_API_RESPONSE_TIMEOUT,
} from 'src/utils/constants/constant';
import { User } from 'src/entity/user.entity';
import { BigQueryConfig } from 'src/entity/big-query-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, BigQueryConfig]),
    HttpModule.register({
      timeout: EXT_API_RESPONSE_TIMEOUT,
      maxRedirects: EXT_API_MAX_REDIRECTS,
    }),
  ],
  controllers: [BigQueryController],
  providers: [UserService, BigQueryService],
})
export class BigQueryModule {}
