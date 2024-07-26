import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';

import { BigQuery } from '@google-cloud/bigquery';
import { BigQueryConfigDto } from './dto/big-query-config.dto';
import { writeFileSync } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { BigQueryConfig } from 'src/entity/big-query-config.entity';
import { Repository } from 'typeorm';
import { OpenAIClient } from 'src/utils/open-ai-client';

@Injectable()
export class BigQueryService {
  private logger: Logger = new Logger(BigQueryService.name);

  private openAIClient: OpenAIClient = new OpenAIClient();

  constructor(
    private readonly userService: UserService,
    @InjectRepository(BigQueryConfig)
    private bigQueryConfigRepository: Repository<BigQueryConfig>,
  ) {}

  async saveConfig(
    accessToken: string,
    bigQueryConfigDto: BigQueryConfigDto,
    serviceAccount: object,
  ) {
    const user = await this.userService.getUserByAccessToken(accessToken);
    if (!user) {
      this.logger.log(`getDatasets: User not found!`);
      throw new UnauthorizedException('User not found!');
    }
    try {
      const bigQueryConfig = new BigQueryConfig();
      bigQueryConfig.userId = user.id;
      bigQueryConfig.projectId = bigQueryConfigDto.projectId;
      bigQueryConfig.serviceAccount = serviceAccount;

      const config = await this.bigQueryConfigRepository.save(bigQueryConfig);
      // console.log('configDetails', configDetails);
      const datasets = await this.getDatasetsWithNoAuth(config.id);
      return { id: config.id, datasets };
    } catch (error) {
      console.error('saveConfig: Error code:', error.code);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Config already exists!');
      } else {
        throw new InternalServerErrorException('Error saving config!');
      }
    }
  }

  async getConfigs(accessToken: string) {
    console.log('getConfigs method called...');
    const user = await this.userService.getUserByAccessToken(accessToken);
    if (!user) {
      this.logger.log(`getDatasets: User not found!`);
      throw new UnauthorizedException('User not found!');
    }

    const bigQueryConfigs = await this.bigQueryConfigRepository.find({
      where: { userId: user.id },
    });
    if (!bigQueryConfigs || bigQueryConfigs.length === 0) {
      return null;
    }

    const configs = [];
    bigQueryConfigs.forEach(async (config) => {
      const { projectId, id } = config;
      configs.push({ id, projectId });
    });

    return configs;
  }

  async getBigQueryClient(id: number) {
    const bigQueryConfig = await this.bigQueryConfigRepository.findOne({
      where: { id },
    });
    const { projectId, serviceAccount } = bigQueryConfig;

    const serviceAccountString = JSON.stringify(serviceAccount);
    writeFileSync('./service-account-temp.json', serviceAccountString);

    const bigQuery = new BigQuery({
      projectId,
      // keyFilename: '/Users/sumved/Downloads/ask-bageera-fcf0165c498c.json',
      keyFilename: './service-account-temp.json',
    });

    return bigQuery;
  }

  async getDatasetsWithNoAuth(configId: number) {
    try {
      const bigQueryClient = await this.getBigQueryClient(configId);

      const [datasets] = await bigQueryClient.getDatasets();
      const datasetNames = datasets.map((dataset) => dataset.id);
      this.logger.log(
        `getDatasetsWithNoAuth: Datasets: ${JSON.stringify(datasetNames)}`,
      );
      return datasetNames;
    } catch (error) {
      this.logger.error(
        'getDatasetsWithNoAuth: Error getting datasets:',
        error,
      );
      throw new InternalServerErrorException('Error getting datasets');
    }
  }

  async getDatasets(accessToken: string, configId: number) {
    const user = await this.userService.getUserByAccessToken(accessToken);
    if (!user) {
      this.logger.log(`getDatasets: User not found!`);
      throw new UnauthorizedException('User not found!');
    }
    return this.getDatasetsWithNoAuth(configId);
  }

  async getTables(accessToken: string, configId: number, datasetId: string) {
    const user = await this.userService.getUserByAccessToken(accessToken);
    if (!user) {
      this.logger.log(`getTables: User not found!`);
      throw new UnauthorizedException('User not found!');
    }
    try {
      const bigQueryClient = await this.getBigQueryClient(configId);
      const dataset = bigQueryClient.dataset(datasetId);
      const [tables] = await dataset.getTables();
      // console.log('Tables:', JSON.stringify(tables[0], null, 2));
      const tableIds = tables.map((table) => table.metadata.id.split(':')[1]);
      return tableIds;
    } catch (error) {
      this.logger.error('getTables: Error getting schemas:', error);
      throw new InternalServerErrorException('Error getting schemas');
    }
  }

  async getSchemasWithNoAuth(
    configId: number,
    datasetId: string,
    tableIds: Array<string>,
  ) {
    try {
      console.log('getSchemasWithNoAuth: tableIds', tableIds);
      const bigQueryClient = await this.getBigQueryClient(configId);
      const dataset = bigQueryClient.dataset(datasetId);
      const schemaPromises = tableIds.map(async (tableId) => {
        const table = dataset.table(tableId.split('.')[1]);
        const [metadata] = await table.getMetadata();
        // console.log(`${tableId} schema:`, JSON.stringify(metadata, null, 2));
        const fields = [];
        metadata.schema.fields.forEach((field) => {
          if (!field.name.startsWith('__')) {
            fields.push({ name: field.name, type: field.type.toLowerCase() });
          }
        });
        return {
          id: tableId,
          fields,
        };
      });
      const schemas = await Promise.all(schemaPromises);
      return schemas;
    } catch (error) {
      console.error(error);
      this.logger.error('getSchemas: Error getting schemas:', error);
      throw new InternalServerErrorException('Error getting schemas');
    }
  }

  async getSchemas(
    accessToken: string,
    configId: number,
    datasetId: string,
    tableIds: Array<string>,
  ) {
    const user = await this.userService.getUserByAccessToken(accessToken);
    if (!user) {
      this.logger.log(`getSchemas: User not found!`);
      throw new UnauthorizedException('User not found!');
    }
    return this.getSchemasWithNoAuth(configId, datasetId, tableIds);
  }

  jsonArrayToCsv(jsonArray) {
    const csv = jsonArray
      .map((item) => {
        return `${item.name}(${item.type})`;
      })
      .join(', ');
    return csv;
  }

  async generateViewTableCreateQuery(
    accessToken: string,
    configId: number,
    datasetId: string,
    tableIds: Array<string>,
    leftTableId: string,
  ) {
    console.log('generateViewTableCreateQuery: tableNames: ', tableIds);
    console.log('generateViewTableCreateQuery: leftTableId: ', leftTableId);
    console.log('generateViewTableCreateQuery: configId: ', configId);
    console.log('generateViewTableCreateQuery: datasetId: ', datasetId);
    const schemas = await this.getSchemas(
      accessToken,
      configId,
      datasetId,
      tableIds,
    );
    let stringifiedSchemas = schemas
      .map((schema) => {
        const stringifiedSchema =
          '\n\n### ' +
          schema.id +
          ' table:\n\n' +
          this.jsonArrayToCsv(schema.fields);
        return stringifiedSchema;
      })
      .join('');
    if (leftTableId) {
      stringifiedSchemas =
        '\n\n### The leftmost table in the join query is ' +
        leftTableId +
        '.' +
        stringifiedSchemas;
    }
    this.logger.log(
      'generateViewTableCreateQuery: Stringified schemas: ',
      stringifiedSchemas,
    );
    const denormalizedQueryResponse =
      await this.openAIClient.generateDenormalizedView(stringifiedSchemas);
    return denormalizedQueryResponse;
  }

  async selectFromTable(configId: number, query: string) {
    const bigQuery = await this.getBigQueryClient(configId);
    const options = { query };
    try {
      const [job] = await bigQuery.createQueryJob(options);
      const [rows] = await job.getQueryResults();
      return rows;
    } catch (error) {
      console.error('Error executing query:', error);
    }
  }
}
