import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from 'src/entity/chat.entity';
import { Table } from 'src/entity/table.entity';
import { User } from 'src/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { HttpModule } from '@nestjs/axios';
import {
  EXT_API_MAX_REDIRECTS,
  EXT_API_RESPONSE_TIMEOUT,
} from 'src/utils/constants/constant';
import { BigQueryService } from 'src/big-query/big-query.service';
import { BigQueryConfig } from 'src/entity/big-query-config.entity';
import { View } from 'src/entity/view.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Table, Chat, BigQueryConfig]),
    HttpModule.register({
      timeout: EXT_API_RESPONSE_TIMEOUT,
      maxRedirects: EXT_API_MAX_REDIRECTS,
    }),
  ],
  controllers: [ChatController],
  providers: [UserService, ChatService, BigQueryService],
})
export class ChatModule {}
