import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from 'src/user/user.service';
import { User } from 'src/entity/user.entity';
import { ViewController } from './view.controller';
import { ViewService } from './view.service';

import {
  EXT_API_MAX_REDIRECTS,
  EXT_API_RESPONSE_TIMEOUT,
} from 'src/utils/constants/constant';
import { View } from 'src/entity/view.entity';
import { BigQueryService } from 'src/big-query/big-query.service';
import { BigQueryConfig } from 'src/entity/big-query-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, BigQueryConfig, View]),
    HttpModule.register({
      timeout: EXT_API_RESPONSE_TIMEOUT,
      maxRedirects: EXT_API_MAX_REDIRECTS,
    }),
  ],
  controllers: [ViewController],
  providers: [UserService, BigQueryService, ViewService],
})
export class ViewModule {}
