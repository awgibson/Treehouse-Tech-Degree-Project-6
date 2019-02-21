const cheerio = require('cheerio');
const request = require('request');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const fs = require('fs');

const baseURL = 'http://shirts4mike.com/';




function makeCSV(data) {
    const date = getDate();

    if (!fs.existsSync('./data')) {
        fs.mkdir('./data', { recursive: false }, (err) => {
            if (err) throw err;
        });
    }



    const csvWriter = createCsvWriter({
        header: ['Title', 'Price', 'ImageURL', 'URL', 'Time'],
        path: `./data/${date}.csv`
    });

    csvWriter.writeRecords(data)       // returns a promise
        .then(() => {
            console.log('...done scraping');
        });

}

function getTime() {
    const date = new Date();

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();


    if (hours < 10) {
        hours = `0${hours}`;
    }

    if (minutes < 10) {
        minutes = `0${minutes}`;
    }

    if (seconds < 10) {
        seconds = `0${seconds}`;
    }

    return `${hours}:${minutes}:${seconds}`;
}

function getDate() {
    const date = new Date();

    let year = date.getFullYear();
    let day = date.getDate();
    let month = date.getMonth();


    if (day < 10) {
        day = `0${day}`;
    }

    if (month < 10) {
        month = `0${month}`;
    }

    return `${year}-${month}-${day}`;


}



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



            request(baseURL + hrefs[i], function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    const $ = cheerio.load(body);
                    const time = getTime();


                    shirts.push([$('.shirt-picture span img').attr('alt'), $('.price').text(), baseURL + $('.shirt-picture span img').attr('src'), baseURL + hrefs[i], time]);


                    if (shirts.length === hrefs.length) {
                        makeCSV(shirts);
                    }

                } else {
                    errors(response, error);
                }

            })
        }

    }
    getDetails();
}

function errors(response, error) {
    if (response.statusCode === 404) {
        console.log('Requested site was not found');
        console.log('statusCode:', response && response.statusCode);
    }
    else {
        console.log('Something went wrong!');
        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
    }
}


request(`${baseURL}shirts.php`, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        parse(body);
    } else {
        errors(response, error);
    }
});