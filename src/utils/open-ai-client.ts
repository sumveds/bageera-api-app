import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import {
  OPENAI_API_KEY,
  OPENAI_GPT_TURBO_MODEL,
  OPENAI_GPT_FOUR,
  OPENAI_TEMPERATURE,
  OPENAI_TOP_P,
} from './constants/constant';

@Injectable()
export class OpenAIClient {
  private logger: Logger = new Logger(OpenAIClient.name);

  private buildColumnDescriptionsRequest(snippet: string) {
    const GENERATE_CSV_METADATA = `### You are a Data Analyst. You wish to create a MySQL table into which CSV data will be inserted. Here is a snippet of the CSV file with records and headers:\n#\n${snippet}\n#\n### Determine the table name, csv headers, data types, and descriptions without special characters for the MySQL table and present them in JSON format. Do not add ID column. Only show JSON.`;
    const requestBody = {
      model: OPENAI_GPT_TURBO_MODEL,
      messages: [
        {
          role: 'assistant',
          content: GENERATE_CSV_METADATA,
        },
      ],
      max_tokens: 800,
      temperature: OPENAI_TEMPERATURE,
      top_p: OPENAI_TOP_P,
    };
    return requestBody;
  }

  async generateColumnDescriptions(snippet: string) {
    try {
      const requestBody = this.buildColumnDescriptionsRequest(snippet);
      const response = await axios.post(
        // 'https://api.openai.com/v1/chat/completions',
        'https://visdam-openai-gpt-4.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-03-15-preview',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': `${OPENAI_API_KEY}`,
          },
        },
      );
      this.logger.log(
        `generateColumnDescriptions: Response status: ${response.status}`,
      );
      this.logger.log(
        `generateColumnDescriptions: Response data: ${JSON.stringify(
          response.data,
        )}`,
      );
      const metadata = JSON.parse(response.data.choices[0].message.content);
      this.logger.log(
        `generateColumnDescriptions: Metadata: ${JSON.stringify(metadata)}`,
      );
      return metadata;
    } catch (error) {
      console.error(error); // TODO: Remove
      this.logger.error(`generateColumnDescriptions: Error: ${error.message}`);
      throw error;
    }
  }

  async generateDenormalizedView(stringifiedSchemas: string) {
    try {
      const content = `You're a Senior data analyst.
        You have to create a denormalized table from multiple bigquery tables.
        Your response is ONLY a query which is a denormalized table query with multiple left joins.
        You have to add all the columns from the bigquery tables to the denormalized table.
        You have to provide elaborated and meaningful column names.
        This denormalized table is used to run analytical queries.
        The structure of the bigquery tables are shown below. ${stringifiedSchemas}`;
      const requestBody = {
        model: OPENAI_GPT_TURBO_MODEL,
        messages: [
          {
            role: 'system',
            content,
          },
        ],
        max_tokens: 1000,
        temperature: OPENAI_TEMPERATURE,
        top_p: OPENAI_TOP_P,
      };
      const response = await axios.post(
        // 'https://api.openai.com/v1/chat/completions',
        'https://visdam-openai-gpt-4.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-03-15-preview',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': `${OPENAI_API_KEY}`,
          },
        },
      );
      this.logger.log(
        `generateDenormalizedView: Response status: ${response.status}`,
      );
      this.logger.log(
        `generateDenormalizedView: Response data: ${JSON.stringify(
          response.data,
        )}`,
      );
      const denormalizedQuery = response.data.choices[0].message.content;
      this.logger.log(
        `generateDenormalizedView: Metadata: ${denormalizedQuery}`,
      );
      return denormalizedQuery;
    } catch (error) {
      console.error(error); // TODO: Remove
      this.logger.error(`generateDenormalizedView: Error: ${error.message}`);
      throw error;
    }
  }

  private buildColumnNamesRequest(
    tableName: string,
    descriptions: Array<string>,
  ) {
    this.logger.log(`buildColumnNamesRequest: Descriptions: ${descriptions}`);
    const descriptionsString = descriptions.join('\n# ');
    const GENERATE_COLUMN_NAMES = `### You are a data analyst.\n### You have to suggest business centric column names of a mysql table named ${tableName}.\n#\n# The business descriptions of the columns are shown below in an array - \n# ${descriptionsString}\n#\n### Generate verbose mysql column names. Return only the column names in a json format.`;
    const requestBody = {
      model: OPENAI_GPT_TURBO_MODEL,
      messages: [
        {
          role: 'assistant',
          content: GENERATE_COLUMN_NAMES,
        },
      ],
      max_tokens: 800,
      temperature: OPENAI_TEMPERATURE,
      top_p: OPENAI_TOP_P,
    };
    return requestBody;
  }

  async generateColumnNames(tableName: string, descriptions: Array<string>) {
    try {
      const requestBody = this.buildColumnNamesRequest(tableName, descriptions);
      this.logger.log(
        `generateColumnNames: Request body: ${JSON.stringify(requestBody)}`,
      );
      const response = await axios.post(
        // 'https://api.openai.com/v1/chat/completions',
        'https://visdam-openai-gpt-4.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-03-15-preview',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': `${OPENAI_API_KEY}`,
          },
        },
      );
      this.logger.log(
        `generateColumnNames: Response status: ${response.status}`,
      );
      this.logger.log(
        `generateColumnNames: Response data: ${JSON.stringify(response.data)}`,
      );
      const columnNamesString = response.data.choices[0].message.content.trim();
      const columnNames = JSON.parse(columnNamesString);
      this.logger.log(
        `generateColumnNames: Column names: ${JSON.stringify(columnNames)}`,
      );
      return Object.keys(columnNames);
    } catch (error) {
      console.error(error); // TODO: Remove
      this.logger.error(`generateColumnNames: Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  private buildUpdateDDLRequest(columns: Array<any>) {
    const descriptions = columns.map((column: any) => column.description);
    this.logger.log(
      `buildUpdateDDLRequest: Descriptions: ${JSON.stringify(descriptions)}`,
    );
    const snippet = descriptions.join('\n# ');
    const GENERATE_CSV_METADATA = `### You are a programmer with good english writing skills. \n### You have to convert a numbered list of input text into a numbered list of mysql column names and descriptions both. \n### The descriptions should capture the complete meaning of input text. \n### The mysql column names and descriptions should be easy to understand. \n### Each description has to be 20 words or less and without special characters. \n\n### The input texts are below: \n\n# ${snippet}\n\n### Only show the mysql column names and descriptions in comma separated format, without numbering.`;
    const requestBody = {
      model: OPENAI_GPT_TURBO_MODEL,
      messages: [
        {
          role: 'assistant',
          content: GENERATE_CSV_METADATA,
        },
      ],
      max_tokens: 500,
      temperature: OPENAI_TEMPERATURE,
      top_p: OPENAI_TOP_P,
    };
    return requestBody;
  }

  async updateDDL(columns: Array<any>) {
    try {
      const requestBody = this.buildUpdateDDLRequest(columns);
      const response = await axios.post(
        // 'https://api.openai.com/v1/chat/completions',
        'https://visdam-openai-gpt-4.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-03-15-preview',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': `${OPENAI_API_KEY}`,
          },
        },
      );
      this.logger.log(`updateDDL: Response status: ${response.status}`);
      this.logger.log(
        `updateDDL: Response data: ${JSON.stringify(response.data)}`,
      );
      const content = response.data.choices[0].message.content.trim();
      this.logger.log(`updateDDL: OpenAI response message: ${content}`);

      const columnNamesAndDescriptions = content.split('\n').map((line) => {
        const values = line.split(', ');
        return {
          column_name: values[0],
          description: values[1],
        };
      });
      this.logger.log(
        `updateDDL: OpenAI parsed message: ${columnNamesAndDescriptions}`,
      );
      return columnNamesAndDescriptions;
    } catch (error) {
      this.logger.error(`updateDDL: Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  buildAskQuestionRequest(systemMessage: string, userMessage: string) {
    const requestBody = {
      model: OPENAI_GPT_FOUR,
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 1000,
      temperature: OPENAI_TEMPERATURE,
      top_p: OPENAI_TOP_P,
    };
    return requestBody;
  }

  extractTextInDoubleQuotes(input: string): string {
    const regex = /"([^"]*)"/g;
    let match;
    const result: string[] = [];
    while ((match = regex.exec(input)) !== null) {
      result.push(match[1]);
    }
    if (result[0]) return result[0];
    else return input;
  }

  async askQuestion(systemMessage: string, userMessage: string) {
    try {
      const requestBody = this.buildAskQuestionRequest(
        systemMessage,
        userMessage,
      );
      this.logger.log('askQuestion: Request body:', requestBody);
      console.time('askQuestion');
      const response = await axios.post(
        // 'https://api.openai.com/v1/chat/completions',
        'https://visdam-openai-gpt-4.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-03-15-preview',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': `${OPENAI_API_KEY}`,
          },
        },
      );
      console.timeEnd('askQuestion');
      this.logger.log(`askQuestion: Response status: ${response.status}`);
      this.logger.log(
        `askQuestion: Response data: ${JSON.stringify(response.data)}`,
      );
      const content = response.data.choices[0].message.content.trim();
      try {
        const jsonResponse = JSON.parse(content);
        this.logger.log(
          `askQuestion: OpenAI response message: ${jsonResponse}`,
        );
        return jsonResponse;
      } catch (error) {
        this.logger.error(
          'askQuestion: Error parsing response text:',
          error.message,
        );
        throw new Error(content);
      }
    } catch (error) {
      const errorMessage = error.message;
      this.logger.error('askQuestion: Error: ', errorMessage);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          this.logger.error(
            `askQuestion: Server responded with status code ${axiosError.response.status}`,
          );
          if (axiosError.response.status === HttpStatus.TOO_MANY_REQUESTS) {
            throw new Error(
              `Apologies! There’s been an overwhelming influx of requests.`,
            );
          }
        }
        throw new Error(
          `Apologies! I can't answer your query because of: ${errorMessage}`,
        );
      } else {
        throw new Error(this.extractTextInDoubleQuotes(error.message));
      }
    }
  }
}
