import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entity/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { HttpModule } from '@nestjs/axios';
import {
  EXT_API_MAX_REDIRECTS,
  EXT_API_RESPONSE_TIMEOUT,
} from 'src/utils/constants/constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    HttpModule.register({
      timeout: EXT_API_RESPONSE_TIMEOUT,
      maxRedirects: EXT_API_MAX_REDIRECTS,
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
