'use strict';

const Alexa = require('alexa-sdk');
const http = require('http');
const APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).
var QOD_EndPoint = 'http://quotes.rest/qod.json?api_key=WZORiy_8tjEx6jZTTD6rHgeF';
var QOD_Categories_EndPoint = 'http://quotes.rest/qod/categories.json?api_key=WZORiy_8tjEx6jZTTD6rHgeF';
var alexaSDK;
var serviceError = 'Sorry, We are not able to get the Quote Of the Day';
var categoryError = 'Sorry, This Quote Of the Day category is not supported';
var cardTitle = 'Quote Of The Day';
var goodByeMsg = 'Goodbye, Thank you for using the quote of the day.';
var defaultCategory = "inspire";
var defaultQuote = "The best preparation for tomorrow is doing your best today. By H. Jackson Brown";
var defaultCategories = "inspire,management,sports,life,funny,love,art,students";

function handleAllCategoriesRequest() {
    makeHttpRequest(QOD_Categories_EndPoint, function ResponseCallback(err, data) {
        var speechOutput = null;

        if (err) {
            //console.log("Service Error 1 - " + serviceError);
            alexaSDK.emit(':tellWithCard', defaultCategories, cardTitle, defaultCategories, null);
        } else {
            var dataObj = JSON.parse(data);
            if (dataObj && dataObj.contents && dataObj.contents.categories) {
                for (var category in dataObj.contents.categories) {
                    if (speechOutput)
                     speechOutput = speechOutput + ", " + category;
                    else
                     speechOutput = category;
                }
                alexaSDK.emit(':tellWithCard', speechOutput, cardTitle, speechOutput, null);
            }
            else {
                alexaSDK.emit(':tellWithCard', serviceError, cardTitle, serviceError, null);

            }
        }

    });
}

function handleQuoteOfDayRequest(categoryName) {
    makeHttpRequest(QOD_EndPoint + '&category=' + categoryName, function ResponseCallback(err, data) {
        var speechOutput = '';

        if (err) {
             console.log("Service Error 1 - " + serviceError);
             alexaSDK.emit(':tellWithCard', defaultQuote, cardTitle, defaultQuote, null);
        } else {
            var dataObj = JSON.parse(data);
            if (dataObj && dataObj.failure)
             alexaSDK.emit(':tellWithCard', categoryError, cardTitle, categoryError, null);
            else if (dataObj && dataObj.contents && dataObj.contents.quotes) {
                speechOutput = dataObj.contents.quotes[0].quote + " By " +
                    dataObj.contents.quotes[0].author;
                alexaSDK.emit(':tellWithCard', speechOutput, cardTitle, speechOutput, null);
            }
            else {
                console.log("Service Error 2 - " + serviceError);
                alexaSDK.emit(':tellWithCard', serviceError, cardTitle, serviceError, null);

            }
        }

    });
}

function makeHttpRequest(endPoint, ResponseCallback) {
    http.get(endPoint, function (res) {
        var response = '';
        console.log('Status Code: ' + res.statusCode);
        if (res.statusCode != 200) {
            ResponseCallback(null, defaultQuote);
        }
        res.on('data', function (data) {
            response += data;
        });

        res.on('end', function () {
            ResponseCallback(null, response);
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        ResponseCallback(new Error(e.message));
    });
}

function getCategoryNameFromIntent(intent) {

    var categorySlot = intent.slots.Category;

    if (!categorySlot || !categorySlot.value) {
        return defaultCategory;
    } else {

        return categorySlot.value;
    }
}


const handlers = {
    'LaunchRequest': function () {
        alexaSDK = this;
        handleQuoteOfDayRequest(defaultCategory);
    },
    'QuoteOfDayIntent': function () {
        alexaSDK = this;
        handleQuoteOfDayRequest(defaultCategory);
    },
    'QuoteOfDayByCategoryIntent': function () {
        alexaSDK = this;
        var category = getCategoryNameFromIntent(this.event.request.intent);
        handleQuoteOfDayRequest(category);
    },
    'GetCategoriesIntent': function () {
        alexaSDK = this;
        handleAllCategoriesRequest();
    },
    'AMAZON.StopIntent': function () {
       this.emit(':tellWithCard', goodByeMsg, cardTitle, goodByeMsg, null);
    },
    'AMAZON.CancelIntent': function () {
       this.emit(':tellWithCard', goodByeMsg, cardTitle, goodByeMsg, null);
    }
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
