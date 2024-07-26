import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ViewService } from './view.service';
import { ViewDto } from './dto/view.dto';

@Controller('views')
export class ViewController {
  constructor(private readonly viewService: ViewService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createView(@Req() request: Request, @Body() viewDto: ViewDto) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      return this.viewService.createView(accessToken, viewDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getViews(@Req() request: Request) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      return this.viewService.getViews(accessToken);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
