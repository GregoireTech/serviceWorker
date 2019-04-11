const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'us-cdbr-iron-east-01.cleardb.net',
    user: 'b771c9ee0d15eb',
    database:'heroku_a9227eda5f9398f',
    password: '753e08c9'
});

module.exports = pool.promise();