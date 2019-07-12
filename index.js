/**
 * This program was written in March 2019 by Grégoire Claise for Overdrive Ltd.
 */


///////////////////////////////////////////////////////////////
//                       IMPORTS                             //
///////////////////////////////////////////////////////////////
const db = require("./util/database");
const sourceTableQuery = require("./util/query").sourceRequest;
const targetTableQuery = require("./util/query").targetRequest;
// Month data Object
const MonthData = require('./MonthData');

///////////////////////////////////////////////////////////////
//                       CONSTANTS                           //
///////////////////////////////////////////////////////////////
const INIT_MODE = false;
const UPDATE_DEPTH = 4; // Update the N last months if data already present

// VARIABLES
let monthsToUpdate = [];

///////////////////////////////////////////////////////////////
//                       FUNCTIONS                           //
///////////////////////////////////////////////////////////////

/**
 * Adds n months to update to the monthsToUpdate
 */
const setUpdateDepth = () => {
    let monthYear, tmpYear;
    // Define current month and year
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();
    // Define start year and date
    tmpYear = curYear - Math.floor(UPDATE_DEPTH / 12);
    if (UPDATE_DEPTH > curMonth) tmpYear = tmpYear -1;
    const restMonth = UPDATE_DEPTH - Math.floor(UPDATE_DEPTH / 12) * 12;
    let tmpMonth = curMonth - restMonth + 1;
    if (tmpMonth < 1) tmpMonth = tmpMonth + 12;
    while (tmpYear < curYear || (tmpMonth <= curMonth && tmpYear === curYear)) {
        if (tmpMonth < 10) tmpMonth = "0" + tmpMonth;
        monthYear = `${tmpMonth}_${tmpYear}`;
        monthsToUpdate.push(monthYear);

        tmpMonth++;
        if (tmpMonth > 12) {
            tmpMonth = tmpMonth - 12;
            tmpYear++;
        }
    }
}

/**
 * Runs a query to the SQL DB and returns a Promise that resolves with response 
 * or rejects with error.
 * @param {string} query 
 * @returns {Promise}
 */
const fetchData = query => {
    return new Promise((resolve, reject) => {
        db.execute(query)
            .then(data => {
                resolve(data);
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * Takes the raw data array and converts it to a dictionary with its primary keys
 * (month, year, comp_id)
 * @param {Array} rawData
 * @returns {Object} Dictionary
 */
const mapData = rawData => {
    let dataObj = {};
    // Create dictionary
    for (const item of rawData) {
        try {
            // Create the companyDic object in the data object if it doesn't already exist
            if (!dataObj[item.comp_id]) dataObj[item.comp_id] = {};
            // Get the month and year properties and add the to the item
            if (item.month_year && item.sales_data) {
                const newItem = new MonthData(item);
                // Add to data object
                dataObj[item.comp_id][item.month_year] = newItem;
            } else if (item.month) {
                let month_year = `${item.month}_${item.year}`;
                if (item.month < 10) month_year = "0" + month_year;
                dataObj[item.comp_id][month_year] = 1;

            } else {
                console.log('pb ' + item);
            }
        } catch (e) {
            console.log(e);
        }
    }
    //console.log(dataObj[1]['03_2018'])
    return dataObj;
};

/**
 * For every item in the source table, give it a flag = "U" if it exists
 * in the TARGET table, a flag = "I" otherwise
 * @param {Object} dbDic
 * @param {Object} sourceDic
 */
const compareDics = (dbDic, sourceDic) => {
    let resultStatements = [];
    let updateCtr = 0;
    let insertCtr = 0;
    for (let companyID in sourceDic) {
        companyDic = sourceDic[companyID];
        // for all companies in the dictionary, loop through every monthData
        for (let monthYear in companyDic) {
            const Item = sourceDic[companyID][monthYear];
            Item.calculateKPIs(sourceDic);

            let exists = false;
            if (dbDic[companyID]) {
                // The company object already exists in DB
                if (dbDic[companyID][monthYear]) {
                    // The company/month_year combination exists in DB
                    exists = true;
                    if (INIT_MODE || monthsToUpdate.includes(monthYear)) {
                        // If INIT_MODE is activated OR if the month_year is included in monthsToUpdate
                        resultStatements.push(Item.generateStatement('U'));
                        updateCtr++;
                    }
                }
            }
            if (!exists) {
                resultStatements.push(Item.generateStatement('I'));
                insertCtr++;
            }

        }

    }
    return resultStatements;
};

/**
 * Sends a request to the DB with the statements sent in as parameters.
 * @param {string} statement 
 */
const executeStatement = statement => {
    //console.log('Executing statement...');
    //console.log(statement);
    db.execute(statement)
        .then(result => {
            //console.log(result);
        })
        .catch(err => {
            console.log('ERROR SYNCHRO');
            console.log(err);
        });
}



///////////////////////////////////////////////////////////////
//                       DEV                                 //
///////////////////////////////////////////////////////////////
/*
const fs = require('fs');
let logString = "";
const saveToLogString = string => {
    logString += string;
    logString += "\n";
}
const saveToSQLFile = () => {
    fs.writeFile("test.sql", logString, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });
}

*/
///////////////////////////////////////////////////////////////
//                       MAIN                                //
///////////////////////////////////////////////////////////////

const main = () => {
    console.log('Try to run script at: ' + new Date());
    let sourceDic, targetDic;
    // Retrieve existing data from target
    setUpdateDepth();
    //console.log(monthsToUpdate);
    const sourceRequest = sourceTableQuery();
    fetchData(sourceRequest)
        .then(data => {
            // Format the result
            const rawData = data[0];
            console.log(rawData.length + ' month items retrieved');
            sourceDic = mapData(rawData);
            // Get snapshot from Target table for comparison
            const targetRequest = targetTableQuery();
            return fetchData(targetRequest);
        })
        .then(data => {
            // Map the retrieved data to a dictionary
            targetDic = mapData(data[0]);
            // Retrieve a list of operations to run
            const requestStatements = compareDics(targetDic, sourceDic);
            // Update the target table
            for (const statement of requestStatements) {
                //saveToLogString(statement);
                executeStatement(statement);
            }
            //executeStatement('COMMIT;');
            //saveToSQLFile();
            console.log('Last successful run at ' + new Date());
        })
        .catch(err => {
            console.log(err);
        });
};

main();