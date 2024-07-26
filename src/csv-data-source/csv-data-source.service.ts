import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as Papa from 'papaparse';
import { Readable } from 'stream';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as FormData from 'form-data';

const anyDateParser = require('any-date-parser');
const time24Hours = require('any-date-parser/src/formats/time24Hours/time24Hours.js');
anyDateParser.addFormats([time24Hours]);

import { OpenAIClient } from 'src/utils/open-ai-client';
import { pool } from 'src/utils/mysql';
import {
  arrayToString,
  escapeString,
  percentToFraction,
  removeDuplicates,
  replaceKeys,
  stringToBoolean,
} from 'src/utils/utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from 'src/entity/table.entity';
import { UserService } from 'src/user/user.service';
import DataType from 'src/utils/DataType';
import {
  DATE_FORMAT,
  DATE_TIME_FORMAT,
  SCHEMA_DDL_API_ENDPOINT,
  TIME_FORMAT,
} from 'src/utils/constants/constant';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class CsvDataSourceService {
  private logger: Logger = new Logger(CsvDataSourceService.name);

  private openAIClient: OpenAIClient = new OpenAIClient();

  private readonly MAX_COLUMNS = 50;
  private readonly MAX_ROWS = 100000;
  private readonly TIMEOUT = 2 * 60 * 1000; // 2 minutes

  constructor(
    @InjectRepository(Table) private tableRepository: Repository<Table>,
    private readonly userService: UserService,
    private readonly httpService: HttpService,
  ) {}

  async generateDataTypes(accessToken: string, file: Express.Multer.File) {
    const formData = new FormData();
    formData.append('file', file.buffer, { filename: file.originalname });
    console.time('generateDataTypes');
    const response = await this.httpService.axiosRef.post(
      SCHEMA_DDL_API_ENDPOINT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: this.TIMEOUT,
      },
    );
    console.timeEnd('generateDataTypes');
    this.logger.log(`generateDataTypes: Response status: ${response.status}`);
    this.logger.log(
      `generateDataTypes: Response data: ${JSON.stringify(response.data)}`,
    );
    return response.data;
  }

  validateCsv(file: Express.Multer.File) {
    const fileContent = file.buffer.toString('utf-8');
    const { data, errors } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    if (errors.length > 0) {
      throw new HttpException(
        `Error parsing file: ${errors[0].message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (data.length > this.MAX_ROWS) {
      this.logger.log(`validateCsv: data.length: ${data.length}`);
      throw new HttpException(
        `Max number of rows allowed is ${this.MAX_ROWS}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const rawHeaders = Object.keys(data[0]);
    if (rawHeaders.length > this.MAX_COLUMNS) {
      throw new HttpException(
        `Max number of columns allowed is ${this.MAX_COLUMNS}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return { rawHeaders, rows: data };
  }

  getRandomRows(jsonArray: any[], n: number): any[][] {
    // Create a shallow copy of the input array to avoid modifying the original
    const array = jsonArray.slice();
    const result = [];
    while (result.length < n && array.length > 0) {
      // Generate a random index within the array length
      const randomIndex = Math.floor(Math.random() * array.length);
      // Remove a random object from the array
      const randomObject = array.splice(randomIndex, 1)[0];
      // Get an array of the object's values
      const values = Object.values(randomObject);
      result.push(values);
    }
    return result;
  }

  getSnippet(headers: any, rows: any) {
    const randomRows = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      randomRows.push(row.join(','));
    }
    const snippet = '# ' + headers.join(',') + '\n# ' + randomRows.join('\n# ');
    return snippet;
  }

  buildColumns(headers, columnNames, columnDataTypes, columnDescriptions) {
    const columns = [];
    columnNames.forEach((columnName: string, index: number) => {
      if (columnDataTypes[headers[index]]['type'] === DataType.Enum) {
        columnDataTypes[headers[index]]['possible_values'].push(null);
        columnDataTypes[headers[index]]['possible_values'] = removeDuplicates(
          columnDataTypes[headers[index]]['possible_values'],
        );
      }
      columns.push({
        id: index,
        csv_header: headers[index],
        column_name: columnName,
        data_type: columnDataTypes[headers[index]]['type'],
        possible_values: columnDataTypes[headers[index]]['possible_values'],
        description: columnDescriptions.descriptions[index],
      });
    });
    return columns;
  }

  async generateDDL(accessToken: string, file: Express.Multer.File) {
    try {
      const { rawHeaders, rows } = this.validateCsv(file);
      // If any of the headers named as `id`, that needs to renamed to `external_id`
      const headers = rawHeaders.map((header) => {
        if (header.toLowerCase() === 'id') {
          return 'external_id';
        }
        return header;
      });
      this.logger.log(`generateDDL: headers: ${headers}`);
      this.logger.log(`generateDDL: rows: ${JSON.stringify(rows.slice(0, 5))}`);
      const randomRows = this.getRandomRows(rows, 10);
      this.logger.log(`generateDDL: randomRows: ${randomRows}`);
      const snippet = this.getSnippet(headers, randomRows);
      this.logger.log(`generateDDL: snippet: ${snippet}`);

      const [columnDataTypes, columnDescriptions] = await Promise.all([
        this.generateDataTypes(accessToken, file),
        this.openAIClient.generateColumnDescriptions(snippet),
      ]);
      // Rename the key `id` to `external_id` in the columnDataTypes object.
      replaceKeys(columnDataTypes, 'id', 'external_id');
      this.logger.log(
        `generateDDL: columnDataTypes: ${JSON.stringify(columnDataTypes)}`,
      );
      this.logger.log(
        `generateDDL: columnDetails: ${JSON.stringify(columnDescriptions)}`,
      );
      const { descriptions, table_name: tableName } = columnDescriptions;
      const columnNames: Array<string> =
        await this.openAIClient.generateColumnNames(tableName, descriptions);
      this.logger.log(`generateDDL: Column names: ${columnNames}`);
      const columns = this.buildColumns(
        headers,
        columnNames,
        columnDataTypes,
        columnDescriptions,
      );
      const metadata = {
        table: {
          name: tableName,
          columns,
        },
      };
      this.logger.log(
        `generateDDL: New metadata: ${JSON.stringify(metadata, null, 2)}`,
      );
      return metadata;
    } catch (error) {
      this.logger.error(error.message);
      console.error(error);
      throw new HttpException(
        `Error generating DDL: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateDDL(table: any) {
    const { columns } = table;
    const columnNamesAndDescriptions = await this.openAIClient.updateDDL(
      columns,
    );
    this.logger.log(
      `updateDDL: New descriptions: ${JSON.stringify(
        columnNamesAndDescriptions,
      )}`,
    );
    columns.forEach((column: any, index: number) => {
      column.column_name =
        columnNamesAndDescriptions[index].column_name.toLowerCase();
      column.description = columnNamesAndDescriptions[index].description;
    });
    this.logger.log(`updateDDL: Updated table: ${JSON.stringify(table)}`);
    return table;
  }

  getCleanInsertingValues(schema: any, values: any[]) {
    this.logger.log(`getCleanInsertingValues: Before: ${values}`);
    const insertingValues = [];
    values.forEach((value: string, index: number) => {
      const trimmedValue = value.trim();
      if (_.isEmpty(trimmedValue)) {
        insertingValues.push(null);
        return;
      }
      switch (schema.columns[index].data_type) {
        case DataType.String:
          insertingValues.push(`${escapeString(trimmedValue)}`);
          break;
        case DataType.Enum:
          insertingValues.push(trimmedValue);
          break;
        case DataType.Decimal:
        case DataType.Integer:
          const num = Number(trimmedValue.replace(/,/g, ''));
          insertingValues.push(num);
          break;
        case DataType.Boolean:
          insertingValues.push(stringToBoolean(trimmedValue));
          break;
        case DataType.Date:
          const date = moment(anyDateParser.fromString(trimmedValue)).format(
            DATE_FORMAT,
          );
          insertingValues.push(`${date}`);
          break;
        case DataType.Percentage:
          const fraction = percentToFraction(trimmedValue);
          insertingValues.push(fraction);
          break;
        case DataType.DateTime:
          const dateTime = moment(
            anyDateParser.fromString(trimmedValue),
          ).format(DATE_TIME_FORMAT);
          insertingValues.push(dateTime);
          break;
        case DataType.Time:
          const time = moment(anyDateParser.fromString(trimmedValue)).format(
            TIME_FORMAT,
          );
          insertingValues.push(time);
          break;
        default:
          insertingValues.push(trimmedValue);
          break;
      }
    });
    this.logger.log(`getCleanInsertingValues: After: ${insertingValues}`);
    return insertingValues;
  }

  getCreateTableQuery(schema: any) {
    const columnDefinitions = schema.columns
      .map((column) => {
        if (column.data_type === DataType.Enum) {
          return `\`${column.column_name}\` ${column.data_type}(${arrayToString(
            column.possible_values,
          )})`;
        } else if (column.data_type === DataType.Percentage) {
          return `\`${column.column_name}\` decimal(5,4)`;
        } else {
          return `\`${column.column_name}\` ${column.data_type}`;
        }
      })
      .join(', ');
    const createTableQuery = `CREATE TABLE ${schema.name} 
      (id int not null primary key auto_increment, ${columnDefinitions})`;
    return createTableQuery;
  }

  toJson(file: Express.Multer.File) {
    const stream = Readable.from(file.buffer);
    return new Promise((resolve, reject) => {
      Papa.parse(stream, {
        header: false,
        complete: (results) => {
          const data = results.data;
          data.shift();
          resolve(data);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  async runInTransaction(
    createTableQuery: string,
    insertRowsStatement: string,
    rows: any[][],
    table: Table,
  ) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      await connection.query(createTableQuery);

      const insertTableSql = `INSERT INTO \`table\` (user_id, uuid, name) VALUES ?`;
      const insertTableValues = Object.values(table);
      await connection.query(insertTableSql, [[insertTableValues]]);

      const [result] = await connection.query(insertRowsStatement, [rows]);
      this.logger.log(`runInTransaction: Result: ${JSON.stringify(result)}`);
      await connection.commit();
      return result;
    } catch (error) {
      console.error('runInTransaction: error: ', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  buildTableObjectForSql(schema: any, user: any) {
    const uid = uuid();
    const tableName = schema.name + '_' + uid.replace(/-/g, '_');
    return {
      userId: user.id,
      uuid: uid,
      name: tableName,
    };
  }

  async uploadCSV(file: Express.Multer.File, schema: any, accessToken: string) {
    try {
      this.logger.log(`uploadCSV: Schema: ${JSON.stringify(schema)}`);
      const user = await this.userService.getUserByAccessToken(accessToken);
      if (!user) {
        this.logger.log(`uploadCSV: User not found!`);
        // TODO: Throw error
      }

      const table = this.buildTableObjectForSql(schema, user);
      schema.name = table.name;

      const createTableQuery = this.getCreateTableQuery(schema);
      this.logger.log('uploadCSV: Create table query:', createTableQuery);
      // @ts-ignore
      const results: any[][] = await this.toJson(file);

      const bulkInsertingValues = [];
      results.forEach((result) => {
        bulkInsertingValues.push(this.getCleanInsertingValues(schema, result));
      });
      const columns = [];
      schema.columns.forEach((column: any) => {
        columns.push(`\`${column.column_name}\``);
      });
      const insertQuery = `INSERT INTO ${schema.name} (${columns}) VALUES ?`;
      this.logger.log('uploadCSV: Insert query:', insertQuery);
      // this.logger.log('uploadCSV: Inserting values:', bulkInsertingValues);
      await this.runInTransaction(
        createTableQuery,
        insertQuery,
        bulkInsertingValues,
        table,
      );
    } catch (error) {
      // TODO: Remove console log
      console.error('uploadCSV: Error: ', error);
      // this.logger.error('uploadCSV: Error: ', error.message);
      throw error;
    }
    return Promise.resolve(schema);
  }
}
