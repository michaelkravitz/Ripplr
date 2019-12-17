const fs = require("fs");
const csv = require("fast-csv");

fs.createReadStream("TestDataSet.csv")
  .pipe(csv.parse({ headers: true }))
  .on("data", row => csv.writeToPath("temp.csv"), row)
  .on("error", err => console.log(err))
  .on("finish", () => console.log("Done writing."));
