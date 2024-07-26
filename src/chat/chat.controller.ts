import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  @HttpCode(HttpStatus.OK)
  async getChatHistory(
    @Req() request: Request,
    @Query('viewId') viewId: number,
  ) {
    const { authorization } = request.headers;
    const accessToken = authorization.split(' ')[1];
    const chatHistory = await this.chatService.getChatHistory(
      accessToken,
      viewId,
    );
    return chatHistory;
  }

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  async query(@Req() request: Request, @Body() body: any) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      const { view, query } = body;
      return this.chatService.askQuestion(view, query, accessToken);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
