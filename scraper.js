const cheerio = require('cheerio');
const request = require('request');
const rp = require('request-promise');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const fs = require('fs');

const test = [];

const csvWriter = createCsvWriter({
    header: ['Title', 'Price', 'URL', 'Image'],
    path: 'csv/file2.csv'
});




//Function that handles all the data parsing
function parse(data) {
    const $ = cheerio.load(data);

    //Helper function to seperate the data
    function getShirtLinks() {
        const shirtLinks = [];

        $('.products li a').each(function (i) {
            shirtLinks[i] = $(this).attr('href');
        });
        return shirtLinks;
    }



    function getDetails() {
        const hrefs = getShirtLinks();
        const shirts = [];
        for (let i = 0; i < hrefs.length; i++) {



            request('http://shirts4mike.com/' + hrefs[i], function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    const $ = cheerio.load(body);

                    shirts.push([$('.shirt-picture span img').attr('alt'), $('.price').text(), hrefs[i], $('.shirt-picture span img').attr('src')]);


                    if (shirts.length === hrefs.length) {
                        csvWriter.writeRecords(shirts)       // returns a promise
                            .then(() => {
                                console.log('...done scraping');
                            });
                    }

                } else {
                    console.log('Something went wrong!');
                    console.log('error:', error);
                    console.log('statusCode:', response && response.statusCode);
                }

            })
        }

    }
    getDetails();
}

function createCSV(data) {

}


request('http://shirts4mike.com/shirts.php', function (error, response, body) {
    if (!error && response.statusCode === 200) {
        parse(body);
    } else {
        console.log('Something went wrong!');
        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
    }
});