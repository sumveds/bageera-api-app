import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from './user.service';
import { UserDto } from './user.dto';

@Controller('user')
export class UserController {
  private logger: Logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async query(@Req() request: Request) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      return this.userService.validateUser(accessToken);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Headers('authorization') authorization: string,
    @Body() userDto: UserDto,
  ) {
    try {
      this.logger.log(`updateUser: User: ${JSON.stringify(userDto, null, 2)}`);
      const accessToken = authorization.split(' ')[1];
      return this.userService.updateUser(accessToken, userDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
