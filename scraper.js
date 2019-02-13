const cheerio = require('cheerio');
const request = require('request');
const rp = require('request-promise');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const fs = require('fs');

const test = [];

const csvWriter = createCsvWriter({
    header: ['Title', 'Price', 'URL', 'Image'],
    path: 'csv/file.csv'
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

            rp('http://shirts4mike.com/' + hrefs[i])
                .then(function (htmlString) {
                    // Process html...
                    const $ = cheerio.load(htmlString);

                    shirts.push([$('.shirt-picture span img').attr('alt'), $('.price').text(), hrefs[i], $('.shirt-picture span img').attr('src')]);

                    // shirts[i][0] = $('.shirt-picture span img').attr('alt');
                    // shirts[i][1] = $('.price').text();
                    // shirts[i][2] = hrefs[i];
                    // shirts[i][3] = $('.shirt-picture span img').attr('src');
                }).then(() => {
                    csvWriter.writeRecords(shirts)       // returns a promise
                        .then(() => {
                            console.log('...Done');
                        });
                })
                .catch(function (err) {
                    // Crawling failed...
                });




            // request('http://shirts4mike.com/' + hrefs[i], function (error, response, body) {
            //     if (!error && response.statusCode === 200) {

            //         const $ = cheerio.load(body);

            //         shirts.push([$('.shirt-picture span img').attr('alt'), $('.price').text(), hrefs[i], $('.shirt-picture span img').attr('src')]);

            //         // shirts[i][0] = $('.shirt-picture span img').attr('alt');
            //         // shirts[i][1] = $('.price').text();
            //         // shirts[i][2] = hrefs[i];
            //         // shirts[i][3] = $('.shirt-picture span img').attr('src');



            //         if (i === hrefs.length - 1) {
            //             csvWriter.writeRecords(shirts)       // returns a promise
            //                 .then(() => {
            //                     console.log('...Done');
            //                 });
            //         }



            //     } else {
            //         console.log('Something went wrong!');
            //         console.log('error:', error);
            //         console.log('statusCode:', response && response.statusCode);
            //     }

            // })
        }

    }
    getDetails();
}

function createCSV(data) {

}




rp('http://shirts4mike.com/shirts.php')
    .then(function (htmlString) {
        // Process html...

        parse(htmlString);

    })
    .catch(function (error) {
        // Crawling failed...
        console.log('Something went wrong!');
        console.log('error:', error);
    });

// rp('http://shirts4mike.com/shirts.php', function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//         parse(body);
//     } else {
//         console.log('Something went wrong!');
//         console.log('error:', error);
//         console.log('statusCode:', response && response.statusCode);
//     }
// });