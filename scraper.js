//---------------------
//Bring in dependencies 
//---------------------
const cheerio = require('cheerio'); //Used to scrape data
const request = require('request'); //Simple HTTP request module
const createCsvWriter = require('csv-writer').createArrayCsvWriter; //CSV module
const fs = require('fs'); //File system module

//----------------
//Global Variables
//----------------
const baseURL = 'http://shirts4mike.com/'; //Holds base URL of website to scrape



//---------------------------------------------------------------
//Function to handle creating the CSV file
//The function takes in the data that was parsed as the parameter
//---------------------------------------------------------------
function makeCSV(data) {
    const date = getDate(); //Calls the getDate function to retrieve a properly formatted date
    const fileDir = `./data`; //Holds directory we wish to create. Stored in variable to make changes easier
    const fileName = `/${date}.csv`; //Holds file name. Store in variable to make changes easier

    //-----------------------------------------------------------------------------------------------------------------------------------------------
    //Conditional the sees if the desired directory to create exists. If it does not it creates the directory. If it already exists, nothing happens.
    //-----------------------------------------------------------------------------------------------------------------------------------------------
    if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: false }, (err) => {
            if (err) throw err;
        });
    }
    //---------------------------------------------------------------
    //Creates the CSV file with proper headers at specified file path
    //---------------------------------------------------------------
    const csvWriter = createCsvWriter({
        header: ['Title', 'Price', 'ImageURL', 'URL', 'Time'],
        path: `${fileDir}${fileName}`
    });
    //-------------------------------------------------------
    //Writes the data passed to this function to the CSV file
    //-------------------------------------------------------
    csvWriter.writeRecords(data)
        .then(() => {
            console.log(`Successfully scraped and logged to ${fileDir}${fileName}.`);
        });
}

//----------------------------------------------------------------------------
//Function that handles getting the current time and formatting it as HH:MM:SS
//----------------------------------------------------------------------------
function getTime() {
    const date = new Date(); //Create new date object

    let hours = date.getHours(); //Get the hours
    let minutes = date.getMinutes(); //Get the minutes
    let seconds = date.getSeconds(); //Get the seconds


    if (hours < 10) {
        hours = `0${hours}`; //Adds a 0 in front of the hours variable if the hours are before 10:00
    }

    if (minutes < 10) {
        minutes = `0${minutes}`; //Adds a 0 in front of the minutes variable if the minutes are before :10
    }

    if (seconds < 10) {
        seconds = `0${seconds}`; //Adds a 0 in front of the seconds variable if the secpmds are before ::10
    }

    return `${hours}:${minutes}:${seconds}`; //returns time properly formatted HH:MM:SS
}

//------------------------------------------------------------------------------
//Function that handles getting the current date and formatting it as YYYY:MM:DD
//------------------------------------------------------------------------------
function getDate() {
    const date = new Date(); //Create a ne date object

    let year = date.getFullYear(); //Get 4 digit year
    let day = date.getDate(); //Get  date
    let month = date.getMonth() + 1; //Get month and adds 1 since months are zero-indexed (January is 0 instead of 1)


    if (day < 10) {
        day = `0${day}`; //Adds 0 in front of date if date is before the 10th of the month
    }

    if (month < 10) {
        month = `0${month}`; //Adds 0 in front of the month if the month is before 10 (October)
    }

    return `${year}-${month}-${day}`;
}


//--------------------------------------------------------------
//Function that handles all the data parsing
//Takes in one parameter which is the HTML from the HTTP request
//--------------------------------------------------------------
function parse(data) {
    const $ = cheerio.load(data); //Loads the HTML into $ with the cheerio module for jQuery-like manipulation

    //Helper function to seperate the data
    function getShirtLinks() {
        const shirtLinks = []; //Array that holds all of the links to the different shirt pages

        //Grabs the href attribute from all <a> tags with each <li> within the <div> with a class of "products" and pushes each to the shirtLinks array
        $('.products li a').each(function (i) {
            shirtLinks[i] = $(this).attr('href');
        });
        return shirtLinks; //returns the array of shirtLinks
    }


    //-------------------------------------------------------------------------------------------------------
    //Function that makes HTTP requests to all of the individual shirt pages and finds the needed information
    //-------------------------------------------------------------------------------------------------------
    function getDetails() {
        const hrefs = getShirtLinks(); //Calls the function to find all of the shirt links and stores them in an array
        const shirts = []; //Empty array that holds all of the shirt info for each shirt. This array will have an array for each shirt page within it so it is formatted properly for the CSV module I chose

        for (let i = 0; i < hrefs.length; i++) { //Loops through all the shirt links and makes HTTP requests for the HTML

            //HTTP request using the baseURL for the website concatted with the whichever shirt page is pulled up in the current loop run
            request(baseURL + hrefs[i], function (error, response, body) {

                //If the request is fine with no errors, scraping begins
                if (!error && response.statusCode === 200) {
                    const $ = cheerio.load(body); //Grabs the HTML and stores it in $ for cheerio to manipulate
                    const time = getTime(); //Gets the current time using the getTime function

                    //Pushes the shirt image alt (which is also the title of the shirt), the price, the shirt image url, the shirt page url, and the time scraped to the shirts array
                    shirts.push([$('.shirt-picture span img').attr('alt'), $('.price').text(), baseURL + $('.shirt-picture span img').attr('src'), baseURL + hrefs[i], time]);

                    //Conditional checks if the length of the shirts array matches the amount of shirts links
                    //If all shirt data is loaded to the array, the makeCSV file is called to generate the CSV file with all of the information
                    if (shirts.length === hrefs.length) {
                        makeCSV(shirts);
                    }

                    //If there is an error or bad response, the errors function is called
                } else {
                    errors(response, error);
                }
            })
        }
    }
    //Calls the getDetails function within the parse function which intiates all of the data parsing
    getDetails();
}

//------------------------------------------------
//Function to handle different status code errors.
//More can be added as needed.                    
//------------------------------------------------
function errors(response, error) {
    let errorMessage = `Status code ${response.statusCode}. `; //Starts building the error message string

    switch (response.statusCode) {
        case 401: errorMessage += `Unauthorized access. Requires username and password`;
            break;
        case 403: errorMessage += `Forbidden. Permission to access was not allowed.`;
            break;
        case 404: errorMessage += `Not Found. Requested URL was not found.`;
            break;
        default: errorMessage += `Error. Unable to scrape data.`;
            break;
    }
    console.log(errorMessage); //Sends error message to console

    //Writes error to an error file. The current date and time is appended to the front of the error and some minor formatting is done for readability in the log file
    fs.appendFile('scraper-error.log', `[${new Date()}] <${errorMessage}> \r\n`, function (err) {
        if (err) throw err;
        console.log('Error logged to scraper-error.log'); //If error was successfully written, this message is printed to console
    });
}


//-----------------------------------------------------------------
//Requests the HTML from the base URL of the website to be scraped
//If successful, the parse function is called to scrape/parse data
//If there is an error, the error function is called.                 
//-----------------------------------------------------------------
request(`${baseURL}shirts.php`, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        parse(body);
    } else {
        errors(response, error);
    }
});