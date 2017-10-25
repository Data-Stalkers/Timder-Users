const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri
});

/**
* @module
*/

/**
 * To be used with the assembling the query
 * @constant
*/
const INDEX_NAME = 'querytimes';

/**
 * To be used with the assembling the query
 * @constant
*/
const LOG_TYPE = 'QueryLog';


/**
 * Sends a log with query information. Appends a time stamp
 * @function
 * @param {Object} options The bulk of what's to be logged
 * @param {number} options.took Time the DB took to get data, in milliseconds
 * @param {number} options.queryScore Number of query conditions in the search
 * @param {number} options.hits Number of items returned in query
 * @param {boolean} options.timedOut Whether or not the request timed out
 */
let logQueryTime = (options) => {
  options.submitted = Date.now();

  client.index({
    index: INDEX_NAME,
    type: LOG_TYPE,
    body: options
  }, (err, res) => {
    if (err) {
      console.error('Logging error:', err);
    } else {
      // console.log('');
    }
  });
};

/**
 * Clears the query logger
 * @function
 */
let clearQueryLogger = () => {
  client.deleteByQuery({
    index: INDEX_NAME
  }, function (err, res) {
    if (err) {
      console.error('Deletion error:', err);
    } else {
      console.info('Deletion success', res);
    }
  });
};

// clearQueryLogger();

module.exports = {
  logQueryTime
};
