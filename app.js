const cheerio = require("cheerio");
const cheerioTableparser = require("cheerio-tableparser");
const got = require("got");
const fs = require("fs");
const figlet = require("figlet");
const chalk = require("chalk");

// below link returns all addresses within TR 13333
// TR 13333 should bring back 82 records.
// http://zimas.lacity.org/ajaxSearchResults.aspx?search=legal&tract=TR%2013333&block=&lot=
//   address: "td.searchCell:nth-child(2) > a",
//   zipcode: "td.searchCell:nth-child(4) > a"

var tract_userinput;

var addresses = [];
var zipcodes = [];
var polygons = [];

var permitID = [];
var JobID = [];
var JobType = [];
var PermitStatus = [];
var PermitDescription = [];

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

const resultsObj = {
  addresses: [],
  zipcodes: [],
  PIN: []
};

var refinedMorph = {
  addresses: [],
  permitID: [],
  PermitDescription: [],
  PermitStatus: []
};

var urlarr = [];

async function ZimasPermitFinder() {
  for (var i = 0; i < addresses.length; i++) {
    let PIN = resultsObj.PIN[i].toString();
    PIN = PIN.replace(/['']+/g, "");
    PIN = PIN.replace(/[   ]+/g, "");
    var url =
      "https://www.ladbsservices2.lacity.org/OnlineServices/PermitReport/PermitResultsbyPin?pin=" +
      PIN;
    urlarr.push(url);
    console.log("\n     Ripplr: Interpolating data from ", urlarr[i]);
    if (i == addresses.length - 1) {
      break;
    }
  }
  const html = await got(url);
  const $ = cheerio.load(html);

  console.log("\n     Ripplr: Beginning scrape on permit info...");

  console.log($(html.body));

  //   let tableData = $("table.table-nested")
  //     .map(function() {
  //       return $(this)
  //         .text()
  //         .trim();
  //     })
  //     .get();
  //   console.log(tableData);

  // JobID.push($("td:nth-child(2)").text());
  // JobType.push($("td:nth-child(3)").text());
  // PermitDescription.push($("td:nth-child(4)").text());
  // PermitStatus.push($("td:nth-child(5)").text());

  //   for (var i = 0; i < addresses.length; i++) {
  //     refinedMorph.addresses.push(resultsObj.addresses[i]);
  //     refinedMorph.permitID.push(permitID[i]);
  //     // refinedMorph.PermitDescription.push(PermitDescription[i]);
  //     // refinedMorph.PermitStatus.push(PermitStatus[i]);
  //   }

  var asJSON = JSON.stringify(refinedMorph);
  console.log(refinedMorph);
  await fs.writeFile("venue_permits.txt", asJSON, function() {
    // console.log("Ripplr: Results saved into results.txt");
    console.log(
      "\n     Ripplr: Permit Information scraped. Tract " +
        tract_userinput.toString() +
        " permits saved to venue_permits.txt."
    );
  });
  console.log(
    "\n     Ripplr: Tract " + tract_userinput.toString() + " has been crawled."
  );
}

async function ripplZimas() {
  const url =
    "http://zimas.lacity.org/ajaxSearchResults.aspx?search=legal&tract=TR%20" +
    tract_userinput +
    "&block=&lot=";
  const html = await got(url);
  const $ = cheerio.load(html.body);

  // grab addresses
  $("td.searchCell:nth-child(2) a").each(function() {
    addresses.push(
      $(this)
        .text()
        .trim()
    );
  });
  // grab zipcodes
  $("td.searchCell:nth-child(4) a").each(function() {
    zipcodes.push($(this).text());
  });

  // grab polygon identification number
  $("td.searchCell:nth-child(2) a").each(function() {
    var link = $(this).attr("href");
    var re = /DataToPin\(([^()]+)\)/;
    var polyg = link.match(re);

    // clean up junk and extract PIN
    var re2 = /%20/gm;
    var fPoly = polyg[1].toString().replace(re2, "-");
    // console.log("fPoly: ", fPoly);

    var re3 = /-([0-9][0-9][0-9]|-[0-9])/;
    var result = fPoly.match(re3) || [].join("");
    // console.log("this is the result: ", result);

    var re4 = /---|--|-/gm;
    var result2 = fPoly.replace(re4, "   ");

    re5 = /      /gm;
    var result3 = result2.replace(re5, "   ");

    // console.log("fPoly_result: ", result3);

    // push PIN to array
    polygons.push(result3);
  });

  for (var i = 0; i < addresses.length; i++) {
    resultsObj.addresses.push(addresses[i]);
    resultsObj.zipcodes.push(zipcodes[i]);
    resultsObj.PIN.push(polygons[i]);
  }

  var asJSON = JSON.stringify(resultsObj);
  // once everything is scraped the JSON is saved to a txt file
  await fs.writeFile("results.txt", asJSON, function() {
    // console.log("Ripplr: Results saved into results.txt");
    // console.log("Running from within ripplZimas", asJSON);
    ZimasPermitFinder();
  });
}
console.log("\033[2J");
console.log(
  chalk.yellow(
    figlet.textSync("Zimas Permit Finder v1.0.0", {
      horizontalLayout: "full"
    })
  )
);

readline.question(`Please enter Tract Number (CTRL + C to quit.)\n`, number => {
  tract_userinput = number;
  readline.close();
  ripplZimas();
});

// Address .searchCell:nth-child(2) a
// Zip Code .searchCell:nth-child(4) a
// PermitData

// $(div.test table.listing tr).text() <-- brings back text from all the tr tags in that table
