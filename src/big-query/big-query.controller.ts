import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { BigQueryService } from './big-query.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { BigQueryConfigDto } from './dto/big-query-config.dto';

@Controller('big-query')
export class BigQueryController {
  constructor(private readonly bigQueryService: BigQueryService) {}

  @Get('config')
  @HttpCode(HttpStatus.OK)
  async getConfigs(@Req() request: Request) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      return this.bigQueryService.getConfigs(accessToken);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('config')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async saveConfig(
    @Req() request: Request,
    @Body() bigQueryConfigDto: BigQueryConfigDto,
    @UploadedFile() file,
  ) {
    const { authorization } = request.headers;
    const accessToken = authorization.split(' ')[1];
    const serviceAccount = JSON.parse(file.buffer.toString());
    return this.bigQueryService.saveConfig(
      accessToken,
      bigQueryConfigDto,
      serviceAccount,
    );
  }

  @Get('datasets')
  @HttpCode(HttpStatus.OK)
  async getDatasets(
    @Req() request: Request,
    @Query('configId') configId: number,
  ) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      return this.bigQueryService.getDatasets(accessToken, configId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('datasets/:datasetId/tables')
  @HttpCode(HttpStatus.OK)
  async getTables(
    @Req() request: Request,
    @Param('datasetId') datasetId: string,
    @Query('configId') configId: number,
  ) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      return this.bigQueryService.getTables(accessToken, configId, datasetId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('datasets/:datasetId/schemas')
  @HttpCode(HttpStatus.OK)
  async getSchemas(
    @Req() request: Request,
    @Param('datasetId') datasetId: string,
    @Query('configId') configId: number,
    @Body() tableNames: Array<string>,
  ) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      return this.bigQueryService.getSchemas(
        accessToken,
        configId,
        datasetId,
        tableNames,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('datasets/:datasetId/generate-denormalized-schema')
  @HttpCode(HttpStatus.OK)
  async generateViewTableCreateQuery(
    @Req() request: Request,
    @Param('datasetId') datasetId: string,
    @Query('configId') configId: number,
    @Body() body: { leftTableId: string; tableIds: Array<string> },
  ) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      const { leftTableId, tableIds } = body;
      console.log('controller: leftTableId:', leftTableId);
      console.log('controller: tableIds:', tableIds);
      return this.bigQueryService.generateViewTableCreateQuery(
        accessToken,
        configId,
        datasetId,
        tableIds,
        leftTableId,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
