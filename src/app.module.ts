import { CacheModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CsvDataSourceModule } from './csv-data-source/csv-data-source.module';
import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { User } from './entity/user.entity';
import { Table } from './entity/table.entity';
import { Chat } from './entity/chat.entity';
import { BigQueryModule } from './big-query/big-query.module';
import { ViewModule } from './view/view.module';
import { BigQueryConfig } from './entity/big-query-config.entity';
import { View } from './entity/view.entity';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOSTNAME,
      port: Number(process.env.MYSQL_PORT),
      username: process.env.MYSQL_USERNAME,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      // entities: ['dist/**/*.entity{.ts,.js}'],
      entities: [User, Table, Chat, BigQueryConfig, View],
      synchronize: false,
      // logging: ['query', 'error'],
      logging: 'all',
    }),
    CsvDataSourceModule,
    ChatModule,
    BigQueryModule,
    ViewModule,
    UserModule,
  ],
})
export class AppModule {}
