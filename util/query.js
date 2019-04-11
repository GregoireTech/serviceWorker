// /**
//  * Write a string containing all month_year from this month last year to this month
//  * @returns {string}
//  */
// const getLast12Month = () => {
//     let monthsString = '';
//     // Get current month & year
//     const date = new Date();
//     let tmpMonth = date.getMonth() + 1; // convert from array index to month nb (January = 1) 
//     let tmpYear = date.getFullYear() -1; // start from last year
//     for (let monthNb = 0; monthNb < 13; monthNb++) {
//         if (tmpMonth > 12) {
//             tmpMonth = 1;
//             tmpYear ++;
//         }
//         // Concatenate to get month_year string
//         let monthYear = `${tmpMonth}_${tmpYear}`;
//         // Handle the 1_2018 => 01_2018 cases
//         if (tmpMonth < 10) monthYear = '0' + monthYear;
//         // Add item to array and increment
//         monthsString += ` '${monthYear}'`;
//         if (monthNb < 12) monthsString += ',';
//         tmpMonth ++;
//     }
//     //console.log(monthsString);
//     return monthsString;
// }

/**
 * 
 * @returns {string} the query to run
 */
const generateSourceDataQuery = () => {
    //console.log("init mode : " + INIT_MODE);
    // Tables
    let query = "SELECT main_table.comp_id,main_table.month_year ,";
    // First Column
    query += "(SELECT ROUND(amount,2) FROM  qbpl_profit_loss_data AS a4";
    query += " WHERE a4.month_year = main_table.month_year AND a4.comp_id = main_table.comp_id";
    query += " AND a4.title IN('Total Income') limit 1) AS sales_data,";
    // Second column
    query += "(SELECT ROUND(SUM(amount+0),2) FROM  qbpl_profit_loss_data AS a3";
    query += " WHERE a3.month_year= main_table.month_year AND a3.comp_id = main_table.comp_id";
    query += " AND a3.title IN('50110 Catering AM','50130 Catering PM') limit 1)  AS catering,";
    // Third Column
    query += "(SELECT ROUND(amount,2) FROM  qbpl_profit_loss_data AS a5";
    query += " WHERE a5.month_year= main_table.month_year AND a5.comp_id = main_table.comp_id ";
    query += " AND a5.title IN('56025 in Shop Labor') limit 1)  AS labor_cost,";
    query += " (SELECT ROUND(amount,2) FROM  qbpl_profit_loss_data AS a6 ";
    query += " WHERE a6.month_year= main_table.month_year AND a6.comp_id = main_table.comp_id" ;
    query += " AND a6.title IN('Total 55000 Food Costs') limit 1)  AS food_cost,";
    query += " (SELECT ROUND(amount,2) FROM  qbpl_profit_loss_data AS a2 ";
    query += " WHERE a2.month_year= main_table.month_year AND a2.comp_id = main_table.comp_id" ;
    query += " AND a2.title IN('50400 Sampling') limit 1)  AS sampling,";
    query += " (SELECT ROUND(amount,2) FROM  qbpl_profit_loss_data AS a1 ";
    query += " WHERE a1.month_year= main_table.month_year AND a1.comp_id = main_table.comp_id"; 
    query += " AND a1.title IN('50350 Overring') limit 1) AS overring";
    query += " FROM ";
    query += " (SELECT `id`,`comp_id`,`title`,`month_year`,`amount`,`group`,`fully_qualified_name` FROM qbpl_profit_loss_data";
    query += " WHERE title IN('Total Income','50110 Catering AM','50130 Catering PM','56025 in Shop Labor','Total 55000 Food Costs','50400 Sampling','50350 Overring')) AS main_table";
    //query += " WHERE comp_id = 1";
    query += " GROUP BY month_year, comp_id"
    return query;
}



/**
 * creates the request to the result table to retrieve a snapshot of actual state
 */
const generateTargetTableQuery = () => {
    let query = "select month, year, comp_id, month_data_type, sales,";
    query += " sales_growth, sales_ytd, catering, catering_growth, catering_ytd,";
    query += " food_cost, food_cost_p, labor_cost, labor_cost_p, sampling, overring,";
    query += " bonus, bonus_dm";
    query += " from month_data";
    query += " order by comp_id, year, month, month_data_type";

    return query;
};


exports.targetRequest = generateTargetTableQuery;
exports.sourceRequest = generateSourceDataQuery;