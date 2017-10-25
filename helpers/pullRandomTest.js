const elasticsearch = require('elasticsearch');
const faker = require('faker');
const configs = require('../config/config.js');
const logger = require('../database/queryLogger.js');

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
const INDEX_NAME = 'userslist';

/**
 * To be used with the assembling the query
 * @constant
*/
const USER_TYPE = 'User';

/**
 * The size of the user array to be returned with batch query requests
 * @constant
*/
const QUERY_SIZE = 50;

/**
 * Pulls a random user from the database
 * @function
 * @instance
 * @returns {Object} A user object
 */
let getRandomUser = () => {
  let a = new Date().getTime().toString();
  let randomName = faker.name.firstName();
  // let randomName = 'evan';
  console.log('...searching for random name:', randomName);
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      size: 1,
      body: { query: {
        function_score: {
          functions: [
            {
              random_score: { seed: a }
            }
          ]
        }
      }}
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        sendLog(res.took, -2, res.hits.total, res.timed_out);
        console.log(res.hits.hits[0]._source);
        resolve(appendId(res.hits.hits[0]));
      }
    });
  });
};

let sendLog = (took, queryScore, hits, timedOut) => {
  logger.logQueryTime({
    took: took,
    queryScore: queryScore,
    hits: hits,
    timedOut: timedOut
  });
}

let appendId = (obj) => {
  let result = obj._source;
  result.id = obj._id;
  return result;
};


//test
for (var i = 0; i < 5; i++) {
  getRandomUser();
}
