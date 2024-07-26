import { RowDataPacket } from 'mysql2';
import {
  MYSQL_DATABASE,
  MYSQL_HOSTNAME,
  MYSQL_PASSWORD,
  MYSQL_PORT,
  MYSQL_USERNAME,
} from './constants/constant';

const mysqlPromise = require('mysql2/promise');

// create the pool
const pool = mysqlPromise.createPool({
  host: MYSQL_HOSTNAME,
  port: parseInt(MYSQL_PORT),
  user: MYSQL_USERNAME,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
});

async function runQuery(query: string) {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('runQuery: query: ', query);
    const [rows] = await connection.query(query);
    console.log(`runQuery: Result: ${rows}`);
    return rows;
  } catch (error) {
    console.error('runQuery: error: ', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function getTableInfo(tableName: string): Promise<string> {
  // Create a new MySQL connection using the configuration
  const connection = await pool.getConnection();
  try {
    // Run a query to get table information
    const [rows] = await connection.execute(`DESCRIBE ${tableName}`);
    console.log('mysql.getTableInfo: Results from query: ', rows);
    // Output the table name
    let tableInfo = 'The table is called ' + tableName + ' with columns: ';
    // Iterate over each row (each column in the table)
    for (const row of rows) {
      const rowInfo = `${row.Field} (${row.Type})`;
      tableInfo = tableInfo + rowInfo + ', ';
    }
    console.log('mysql.getTableInfo: getTableInfo: ', tableInfo);
    return tableInfo;
  } catch (error) {
    console.error('mysql.getTableInfo: getTableInfo: error: ', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function runQueryInTxn(preparedStatement: string, values: any[][]) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const [rows] = await connection.query(preparedStatement, [values]);
    // console.log(`runQueryInTxn: Result: ${JSON.stringify(rows)}`);
    await connection.commit();
    return rows;
  } catch (error) {
    console.error('runQueryInTxn: error: ', error);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export { pool, runQuery, runQueryInTxn, getTableInfo };
