export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_GPT_TURBO_MODEL = 'gpt-3.5-turbo';
export const OPENAI_GPT_FOUR = 'gpt-4';
export const OPENAI_TEMPERATURE = 0;
export const OPENAI_TOP_P = 1;
export const OPENAI_MAX_RETRIES = 1;
export const OPENAI_API_TIMEOUT = 30000;

export const MYSQL_HOSTNAME = process.env.MYSQL_HOSTNAME;
export const MYSQL_USERNAME = process.env.MYSQL_USERNAME;
export const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
export const MYSQL_PORT = process.env.MYSQL_PORT;
export const MYSQL_DATABASE = process.env.MYSQL_DATABASE;

export const SCHEMA_DDL_API_ENDPOINT = process.env.SCHEMA_DDL_API_ENDPOINT;

export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm:ss';

export const EXT_API_RESPONSE_TIMEOUT = 5000;
export const EXT_API_MAX_REDIRECTS = 5;

export const CACHE_TTL = 60 * 60 * 24 * 1; // 1 day
