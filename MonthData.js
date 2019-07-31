const BONUS_SHARE = 0.05; // 5% of the Turnover increase for the Manager
const DM_BONUS_SHARE = 0.02; // 2% of the Turnover increase for the DM

class MonthData {
    constructor(monthData) {
        this.compId = monthData.comp_id;
        this.monthYear = monthData.month_year;
        this.sales = Math.round(monthData.sales_data);
        this.catering = Math.round(monthData.catering);
        this.foodCost = Math.round(monthData.food_cost);
        this.laborCost = Math.round(monthData.labor_cost);
        this.sampling = Math.round(Math.abs(monthData.sampling));
        this.overring = Math.round(Math.abs(monthData.overring));
        this.month = parseInt(monthData.month_year.split("_")[0]);
        this.year = parseInt(monthData.month_year.split("_")[1]);
        this.salesLastYear = null;
    }

    calculateKPIs(dictionary) {
        this.calculateGrowth(dictionary);
        this.calculateYTD(dictionary);
        if (this.sales) {
            this.foodCostP = Math.round(this.foodCost / this.sales * 1000) / 10;
            this.laborCostP = Math.round(this.laborCost / this.sales * 1000) / 10;
        } else {
            this.foodCostP = null;
            this.laborCostP = null;
        }
    }

    calculateGrowth(dictionary) {
        this.salesGrowth = null;
        this.cateringGrowth = null;
        this.bonus = null;
        this.bonusDM = null;
        let compMonthYear = `${this.month}_${this.year - 1}`;
        if (this.month <= 9) compMonthYear = "0" + compMonthYear;
        if (dictionary[this.compId][compMonthYear]) {
            const compData = dictionary[this.compId][compMonthYear];
            this.salesLastYear = compData.sales;
            if (compData.sales > 0) this.salesGrowth = Math.round((this.sales / compData.sales - 1) * 1000) / 10;
            if (compData.catering > 0) this.cateringGrowth = Math.round((this.catering / compData.catering - 1) * 1000) / 10;
            if (this.salesGrowth > 0) {
                this.bonus = Math.round(BONUS_SHARE * (this.sales - compData.sales));
                this.bonusDM = Math.round(DM_BONUS_SHARE * (this.sales - compData.sales));
            } else {
                this.bonus = 0;
                this.bonusDM = 0;
            }
        }
        // else {
        //     if (this.year > 2017 && this.compId == 1){
        //         console.log(dictionary[this.compId]);
        //         console.log(compMonthYear, this.monthYear); 
        //     } 
        //}
    }

    calculateYTD(dictionary) {
        this.salesYTD = null;
        this.cateringYTD = null;
        if (this.month === 1) {
            this.salesYTD = this.sales;
            this.cateringYTD = this.catering;
        } else {
            let allPresent = true;
            let salesYTD = 0;
            let cateringYTD = 0;
            for (let month = 1; month < this.month; month++) {
                let tmpMonthYear = `${month}_${this.year}`;
                if (month <= 9) tmpMonthYear = "0" + tmpMonthYear;
                if (dictionary[this.compId][tmpMonthYear]) {
                    const toAdd = dictionary[this.compId][tmpMonthYear];
                    salesYTD += toAdd.sales;
                    cateringYTD += toAdd.catering;
                } else {
                    allPresent = false
                }
            }
            if (allPresent) {
                this.salesYTD = salesYTD + this.sales;
                this.cateringYTD = cateringYTD + this.catering;
            }
        }
    }

    generateStatement(flag) {
        let statement;
        if (flag === 'I') {
            statement = this.generateInsert();
        } else if (flag === 'U') {
            statement = this.generateUpdate();
        }
        return statement;
    }

    generateInsert() {
        let statement = `INSERT INTO month_data (`;
        statement += ` month_data_type, comp_id, month, year,`;
        statement += ` sales, sales_growth, sales_ytd,`;
        statement += ` catering, catering_growth, catering_ytd,`;
        statement += ` food_cost, food_cost_p, labor_cost, labor_cost_p,`;
        statement += ` sampling, overring, bonus, bonus_dm, sales_year_m_1)`;
        statement += ` VALUES (`;
        statement += ` 1, ${this.compId}, ${this.month}, ${this.year},`;
        statement += ` ${this.sales}, ${this.salesGrowth}, ${this.salesYTD},`;
        statement += ` ${this.catering}, ${this.cateringGrowth}, ${this.cateringYTD},`;
        statement += ` ${this.foodCost}, ${this.foodCostP}, ${this.laborCost}, ${this.laborCostP},`;
        statement += ` ${this.sampling}, ${this.overring}, ${this.bonus}, ${this.bonusDM},`;
        statement += ` ${this.salesLastYear}`;
        statement += ` ); `;

        return statement;
    }

    generateUpdate() {
        let statement = `UPDATE month_data SET `;
        statement += ` sales = ${this.sales}, sales_growth = ${
        this.salesGrowth
        }, sales_ytd = ${this.salesYTD},`;
        statement += ` catering = ${this.catering}, catering_growth = ${
        this.cateringGrowth
        }, catering_ytd = ${this.cateringYTD},`;
        statement += ` food_cost = ${this.foodCost}, food_cost_p = ${
        this.foodCostP
        }, labor_cost = ${this.laborCost}, labor_cost_p = ${this.laborCostP},`;
        statement += ` sampling = ${this.sampling}, overring = ${
        this.overring
        }, bonus = ${this.bonus}, bonus_dm = ${this.bonusDM},`;
        statement += ` sales_year_m_1 = ${this.salesLastYear}`;
        statement += ` WHERE month_data_type = 1`;
        statement += ` AND comp_id = ${this.compId} AND month = ${
        this.month
        } AND year = ${this.year}; `;
        return statement;
    }
}

module.exports = MonthData;


/* Dictionary format:
 * {
 *      comp_id_1:{
 *               compId,
 *               month,
 *               year,
 *               sales,
 *  KPI             salesGrowth,
 *  KPI             salesYTD,
 *               catering,
 *  KPI             cateringGrowth,
 *   kpi            cateringYTD,
 *               foodCost,
 *  KPI             foodCostP,
 *               laborCost,
 * KPI              laborCostP,
 *               sampling,
 *               overring,
 * KPI              bonus,
 *    KPI           bonusDM
 *          },
 *          ...,
 *          month_year_N: {...}
 *      },
 *      ...,
 *      comp_id_M: {...}
 * }
 */