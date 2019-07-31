const mysql = require('mysql2');
const keys = require('../keys');

const pool = mysql.createPool({
    host: process.env['MSQL_HOST'] || keys.MSQL_HOST,
    user: process.env['MSQL_USER'] || keys.MSQL_USER,
    database: process.env['MSQL_DATABASE'] || keys.MSQL_DATABASE,
    password: process.env['MSQL_PASSWORD'] || keys.MSQL_PASSWORD
});

module.exports = pool.promise();
