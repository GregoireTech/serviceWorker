    /**
     * Connect to PostgreSQL
     *
     * The config is taken from standard env variables
     *
     * @see https://node-postgres.com/features/connecting
     *
     * @returns {Promise<void>}
     */
    const keys = require('../keys');

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
         * Insert row of data into DB, If row already exists it performs UPDATE if numerics are 0 it performs DELETE
         *
         * @param row - object of data
         * @returns {Promise<DocumentClient.QueryOutput | DynamoDB.QueryOutput>}
         */
        async insertRow(row) {
            if (new Decimal(row['sales']).isZero() && new Decimal(row['catering']).isZero()) {
                const res = await this.client.query('DELETE FROM report WHERE store = $1 AND date = $2',
                    [
                        row['store'],
                        row['date']
                    ]);
                return res;
            } else {
                const res = await this.client.query('INSERT INTO report ' +
                    '(store, date, sales, catering) ' +
                    'VALUES ' +
                    '($1, $2, $3, $4) ' +
                    'ON CONFLICT (store, date) ' +
                    'DO UPDATE SET sales = $3, catering = $4 WHERE report.store = $1 AND report.date = $2 ',
                    [
                        row['store'],
                        row['date'],
                        row['sales'],
                        row['catering'],
                    ]);
                return res;
            }
        }
    
        /**
         * Performs raw query on DB for testing purposes
         *
         * @param stmt - SQL statement
         * @param params - statement's params
         * @returns {Promise<DocumentClient.QueryOutput | DynamoDB.QueryOutput>}
         */
        async rawQuery(stmt, params) {
            const result = await this.client.query(stmt, params);
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

    
module.exports.dbService = new PostgresqlService();