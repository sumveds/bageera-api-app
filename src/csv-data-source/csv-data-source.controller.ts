import {
  Body,
  Controller,
  FileTypeValidator,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvDataSourceService } from './csv-data-source.service';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const fileParsingPipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
    new FileTypeValidator({ fileType: 'csv' }),
  ],
});

@Controller('csv')
export class CsvDataSourceController {
  constructor(private readonly csvDataSourceService: CsvDataSourceService) {}

  @Post('generate-metadata')
  @UseInterceptors(FileInterceptor('file'))
  async generateDDL(
    @Headers('authorization') authorization: string,
    @UploadedFile(fileParsingPipe) file: Express.Multer.File,
  ) {
    try {
      const accessToken = authorization.split(' ')[1];
      return await this.csvDataSourceService.generateDDL(accessToken, file);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('update-metadata')
  @HttpCode(HttpStatus.OK)
  async updateDDL(@Body() body: any) {
    try {
      const columns = await this.csvDataSourceService.updateDDL(body);
      return columns;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadCSV(
    @Req() request: Request,
    @UploadedFile(fileParsingPipe) file: Express.Multer.File,
    @Body() body: any,
  ) {
    try {
      const { authorization } = request.headers;
      const accessToken = authorization.split(' ')[1];
      const schema = JSON.parse(body.table);
      const query = await this.csvDataSourceService.uploadCSV(
        file,
        schema,
        accessToken,
      );
      return query;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
