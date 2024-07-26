import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Chat } from 'src/entity/chat.entity';
import { UserService } from 'src/user/user.service';
import { OpenAIClient } from 'src/utils/open-ai-client';
import { BigQueryService } from 'src/big-query/big-query.service';

interface ViewDto {
  id: number;
  configId: number;
  name: string;
  alias: string;
  database: string;
  warehouse: string;
  schema: any;
}

@Injectable()
export class ChatService {
  private logger: Logger = new Logger(ChatService.name);

  private openAIClient: OpenAIClient = new OpenAIClient();

  constructor(
    @InjectRepository(Chat) private chatRepository: Repository<Chat>,
    private readonly userService: UserService,
    private readonly bigQueryService: BigQueryService,
  ) {}

  async getChatHistory(accessToken: string, viewId: number) {
    const user = await this.userService.getUserByAccessToken(accessToken);
    if (!user) {
      this.logger.log(`getChatHistory: User not found!`);
      throw new UnauthorizedException('User not found!');
    }
    try {
      const chats = await this.chatRepository.find({
        where: { userId: user.id, viewId },
      });
      console.log('chats:', JSON.stringify(chats, null, 2));
      return chats;
    } catch (error) {
      console.error('error in getChatHistory:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async askQuestion(viewDto: ViewDto, question: string, accessToken: string) {
    console.log('view:', JSON.stringify(viewDto, null, 2));
    const results = [];
    // const tableName = view.database + '.' + view.name;
    let err;
    try {
      const user = await this.userService.getUserByAccessToken(accessToken);
      if (!user) {
        this.logger.log(`askQuestion: User not found!`);
        throw new UnauthorizedException('User not found!');
      }
      const SYSTEM_CHAT_MESSAGE = `You're an AI data analyst. You have to answer business questions.
      \nYour responses have to be in a JSON array only with format [{ query, explanation }, {query, explanation}, ... ].
      \nData is stored in a ${viewDto.warehouse} warehouse.
      \nThe view table named ${viewDto.schema.id} has below fields:
      \n${this.bigQueryService.jsonArrayToCsv(viewDto.schema.fields)}
      \nDo not return the primary key column in the result.
      \nReturn only important and relevant columns in the query.
      \nYou will recheck your work before sending a response.`;

      const USER_CHAT_MESSAGE = `${question}\n\n ### 1. For questions which are either clear (can be answered from the inputs given so far), or have low ambiguity send the query or queries (when necessary) with explanation containing proof of work.
      2. For questions which have medium or high ambiguity, you can send a null query with explanation seeking relevant information from the user.
      3. The explanations have to be in present tense only.###\n`;

      const responses = await this.openAIClient.askQuestion(
        SYSTEM_CHAT_MESSAGE,
        USER_CHAT_MESSAGE,
      );
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const { query, explanation } = response;
        this.logger.log(`askQuestion: Generated query: ${query}`);
        const result = {};
        let tableData;
        if (query) {
          tableData = await this.bigQueryService.selectFromTable(
            viewDto.configId,
            query,
          );
          console.log('tableData:', tableData);
          result['tableData'] = tableData;
          result['query'] = query;
        }
        result['explanation'] = explanation;
        results.push(result);
        const chat = await this.chatRepository.save({
          userId: user.id,
          viewId: viewDto.id,
          question,
          response: result,
        });
        this.logger.log(`askQuestion: Saved chat: ${JSON.stringify(chat)}`);
      }
    } catch (error) {
      console.error('askQuestion: Error:', error);
      this.logger.error(`askQuestion: Error: ${error.message}`);
      err = error;
    } finally {
      if (err) {
        const errorResults = [];
        errorResults.push({
          explanation: err.message,
        });
        return Promise.resolve({
          question,
          results: errorResults,
        });
      } else {
        const chatResponse = {
          question,
          results,
        };
        this.logger.log('api chat response:', chatResponse);
        return Promise.resolve(chatResponse);
      }
    }
  }
}
