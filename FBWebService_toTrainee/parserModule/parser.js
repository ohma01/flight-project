class Module {
    constructor(mName, total, pass, errList) {
        this.moduleName = mName;
        this.totalNoOfTestCases = total;
        this.noOfTestCasesPassed = pass;
        this.errorList = errList
    }
}
var fs = require("fs-extra")
var exec = require('child-process-promise').exec;

exports.reportGenerator = () => {
    console.log("--- Verifying ---")
    fs.openSync("../result.json", "w")
    return exec("npm test").then(pass => {
        return pass
    }).catch((err) => {
        return err.message
    }).then(() => {
        var resultObj = fs.readFileSync('../result.json')
        result = parse(JSON.parse(resultObj))
        fs.writeJSONSync("../result.json", result);
        return result
    })
}


function parse(dataObj) {
    var reportData = [];
    if (dataObj.suites.length != 0) {
        var moduleName = "";
        for (iterator of dataObj.suites) {
            moduleName = iterator.title;
            var errorList = [];
            for (test of iterator.tests) {
                if (test.result != "passed") {
                    errorList.push(test.title);
                }
            }
            reportData.push(new Module(moduleName, iterator.tests.length, iterator.tests.length - errorList.length, errorList))
        }
    }
    return reportData;
}