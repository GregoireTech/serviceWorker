const mysql = require('mysql2');
const keys = require('../keys');
const PG = require('pg');

const pool = mysql.createPool({
    host: process.env['MSQL_HOST'] || keys.MSQL_HOST,
    user: process.env['MSQL_USER'] || keys.MSQL_USER,
    database: process.env['MSQL_DATABASE'] || keys.MSQL_DATABASE,
    password: process.env['MSQL_PASSWORD'] || keys.MSQL_PASSWORD
});


/**
 * Connect to PostgreSQL
 *
 * The config is taken from standard env variables
 *
 * @see https://node-postgres.com/features/connecting
 *
 * @returns {Promise<void>}
 */
class PostgresqlService {

    /**
     * Connect to PostgreSQL
     *
     * The config is taken from standard env variables
     *
     * @see https://node-postgres.com/features/connecting
     *
     * @returns {Promise<void>}
     */
    async connect() {
        this.client = new PG.Client({
            user: process.env['PGUSER'] || keys.PGUSER ,
            host: process.env['PGHOST'] || keys.PGHOST ,
            database: process.env['PGDATABASE'] || keys.PGDATABASE ,
            password: process.env['PGPASSWORD'] || keys.PGPASSWORD ,
            port: process.env['PGPORT'] || keys.PGPORT,
        });
        await this.client.connect();
    }

    /**
     * Performs raw query on DB for testing purposes
     *
     * @param stmt - SQL statement
     * @returns {Promise<DocumentClient.QueryOutput | DynamoDB.QueryOutput>}
     */
    async rawQuery(stmt) {
        const result = await this.client.query(stmt);
        return result;
    }

    /**
     * Disconnects from DB
     *
     * @returns {Promise<void>}
     */
    async disconnect() {
        await this.client.end()
    }
}

    
module.exports.targetDb = new PostgresqlService();
module.exports.sourceDb = pool.promise();
