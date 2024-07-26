import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ViewDto } from './dto/view.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { View } from 'src/entity/view.entity';
import { BigQueryService } from 'src/big-query/big-query.service';

@Injectable()
export class ViewService {
  private logger: Logger = new Logger(ViewService.name);

  constructor(
    private readonly userService: UserService,
    private readonly bigQueryService: BigQueryService,
    @InjectRepository(View)
    private viewRepository: Repository<View>,
  ) {}

  async createView(accessToken: string, viewDto: ViewDto) {
    const user = await this.userService.getUserByAccessToken(accessToken);
    if (!user) {
      this.logger.log(`getViews: User not found!`);
      throw new UnauthorizedException('User not found!');
    }
    try {
      const bigQueryClient = await this.bigQueryService.getBigQueryClient(
        viewDto.config.id,
      );
      const dataset = await bigQueryClient.dataset(viewDto.database);
      const options = {
        view: viewDto.query,
      };
      const [view] = await dataset.createTable(viewDto.name, options);
      // this.logger.log(`createView: Created view: ${JSON.stringify(view)}`);
      const schemas = await this.bigQueryService.getSchemasWithNoAuth(
        viewDto.config.id,
        viewDto.database,
        [view.metadata.id.split(':')[1]],
      );
      this.logger.log(
        `createView: Created view details: ${JSON.stringify(schemas)}`,
      );
      const result = await this.viewRepository.save({
        userId: user.id,
        configId: viewDto.config.id,
        name: viewDto.name,
        alias: viewDto.alias,
        warehouse: viewDto.warehouse,
        database: viewDto.database,
        schema: schemas[0],
      });
      this.logger.log(
        `createView: Created view details: ${JSON.stringify(result)}`,
      );
      const views = await this.viewRepository.find({
        where: { userId: user.id },
      });
      this.logger.log(`createView: All views: ${JSON.stringify(views)}`);
      return views;
    } catch (error) {
      console.error('error in createView:', error);
      this.logger.error('createView: Error creating view:', error);
      throw new InternalServerErrorException('Error creating view!');
    }
  }

  async getViews(accessToken: string) {
    const user = await this.userService.getUserByAccessToken(accessToken);
    if (!user) {
      this.logger.log(`getViews: User not found!`);
      throw new UnauthorizedException('User not found!');
    }
    try {
      const views = await this.viewRepository.find({
        where: { userId: user.id },
      });
      console.log('views:', views);
      return views;
    } catch (error) {
      this.logger.error('getViews: Error getting views:', error);
      throw new InternalServerErrorException('Error getting views!');
    }
  }
}
