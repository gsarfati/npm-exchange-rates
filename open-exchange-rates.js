/**
 * open-exchange-rates npm module - v0.3
 * by Open Exchange Rates - https://openexchangerates.org
 *
 * nodeJS/npm wrapper for the Open Exchange Rates API.
 * Sign up for an API App ID here: https://openexchangerates.org/signup
 *
 * Requires: http-agent
 *
 * Basic Usage:
 *     var OpenExchangeRates = require('open-exchange-rates');
 *     var oxr = new OpenExchangeRates({app_id: 'YOUR_APP_ID'});
 *     oxr.latest(function(error) {
 *         // `error` or `oxr.error` contains debug info
 *         // if no error, `oxr.rates` and `oxr.base` are available
 *     });
 *
 * See example.js for full usage example.
 * See readme.md for advanced queries and usage.
 */
function OpenExchangeRates(opts) {
  // Module version:
  this.version = '0.3';

  // API base URL:
  this.api_url = 'http://openexchangerates.org/api/';

  // The default base currency ('USD'):
  this.base = 'USD';

  // The rates object:
  this.rates = {};

  // If something goes wrong, details will be stored in `oxr.error`:
  this.error = '';

  this.app_id = opts.app_id;
}

// Loads `latest.json` (latest rates)
OpenExchangeRates.prototype.latest = function(callback) {
  this.load('latest.json', callback);
  return this;
}

// Loads `historical/yyyy-mm-dd.json` (historical rates)
// `date` must be in format `'YYYY-MM-DD'`, e.g. `'2001-12-31'`
OpenExchangeRates.prototype.historical = function(date, callback) {
  this.load('historical/' + date + '.json', callback);
  return this;
}

OpenExchangeRates.prototype.load = function(path, callback) {
  // Default parameters:
  if (typeof path === 'function') callback = path;
  path = (typeof path === 'string') ? path : 'latest.json';

  // Build API URL
  var url = this.api_url + path + '?app_id=' + this.app_id;

  // Create the http-agent that will grab the data:
  var agent = require('http-agent').create('', [{
    method: 'GET',
    uri: url
  }]);

  agent.addListener('next', function (err, agent) {
    var data = (agent && agent.body) ? agent.body : null;
    this.error = err;

    // Parse the API response:
    if ( !this.error ) {
      this.parse.call(this, data, this);
    }

    // Fire callback function, passing in any error and the raw data:
    if ( typeof callback === 'function' ) {
      callback(this.error, data);
    }
  }.bind(this));

  // Start http-agent:
  agent.start();
  return this;
}

// The parse callback function takes the raw API data and parses/validates it.
OpenExchangeRates.prototype.parse = function(data, oxr) {
  // Try to parse the data as JSON:
  try {
    data = JSON.parse(data);
  } catch(err) {
    oxr.error = 'Module error in parsing JSON data: ' + err.toString();
    return oxr;
  }

  // If the API returned an error message:
  if ( data && data.error ) {
    // Create debug message from API error:
    oxr.error = data.status + ' (' + data.message + '): ' + data.description;
    return oxr;
  }

  // The standard API response contains the base currency, an object of
  // exchange rates, and the timestamp of when the rates were published:
  if ( data && data.base && data.rates ) {
    oxr.base = data.base;
    oxr.rates = data.rates;
    oxr.timestamp = data.timestamp * 1000; // (unix to ms)
  } else {
    oxr.error = 'No rates or base currency returned from API';
  }

  return oxr;
};

module.exports = OpenExchangeRates;
