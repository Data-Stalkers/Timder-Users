const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');
const logger = require('./queryLogger.js');

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
 * Helper function to parse the db's return data by appending an ID.
 * @private
 * @function
 * @param {Object} obj A user object from the DB, with the _source key holding the user info
 * @returns {Object} A user object without nested user info and irrelevant data
 */
let appendId = (obj) => {
  let result = obj._source;
  result.id = obj._id;
  return result;
};


/**
 * Pings the server to check connections status
 * @function
 * @instance
*/
let pingServer = () => {
  return new Promise ((resolve, reject) => {
    client.ping({}, function (error) {
      if (error) {
        console.trace('Elasticsearch cluster is down!');
      } else {
        console.log('==== All is well ====');
      }
    });
  });
};

/**
 * Delete everything from database
 * @function
 * @instance
 * @deprecated Use `npm run clean-db` to clean database
 */
let deleteAllUsers = () => {
  return new Promise((resolve, reject) => {
    client.deleteByQuery({
      index: INDEX_NAME
    }, function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

/**
 * Pulls a random user from the database
 * @function
 * @instance
 * @deprecated `getRandomUserByNumID` is more efficient.
 * @returns {Object} A user object
 */
let getRandomUser = () => {
  let a = new Date().getTime().toString();
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      size: 1,
      body: { query: {
        function_score: {
          random_score: { seed: a }
        }
      }}
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        sendLog(res.took, -1, res.hits.total, res.timed_out);
        resolve(appendId(res.hits.hits[0]));
      }
    });
  });
};

/**
 * Query the database with a user's name
 * @function
 * @instance
 * @param {string} name A string representing the user's name
 * @returns {Object} A user object
 */
let queryByName = (name) => {
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      q: 'name:' + name
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        sendLog(res.took, 1, res.hits.total, res.timed_out);
        resolve(appendId(res.hits.hits[0]));
      }
    });
  });
};

/**
 * Query the database by user ID
 * @function
 * @instance
 * @param {string} userId The userID Hash generated by ElasticSearch
 * @returns {Object} A user object
 */
let queryById = (userId) => {
  return new Promise((resolve, reject) => {
    client.get({
      index: INDEX_NAME,
      type: USER_TYPE,
      id: userId
    }, function (err, res) {
      if (err) {
        reject(err);
      }
      resolve(appendId(res));
    });
  });
};

/**
 * Queries the database by a user's location
 * @function
 * @instance
 * @param {Object} input An options object with three keys:
 * @param {string} input.location A string representing a user's location
 * @param {string=} input.genderFilter A string representing a gender to filter by
 * @param {Array=} input.userFilter An array of user IDs to exclude from the results
 * @returns {Array} An array of user objects matching the query
 */
let queryByLocation = (input) => {
  let queryScore = 1;
  let options = { query: {
    bool: {
      must: [
        { match: { location: input.location } }
      ]
    }
  }};
  if (input.genderFilter) {
    options.query.bool.must.push({ match: { gender: input.genderFilter } });
    queryScore++;
  }
  if (input.photoCount) {
    options.query.bool.must.push({ match: { photoCount: input.photoCount } });
    queryScore++;
  }
  if (input.userFilter) {
    queryScore += input.userFilter.length;
    options.query.bool.must_not = [
      { ids:
        { values: input.userFilter }
      }
    ];
  }
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      size: QUERY_SIZE,
      body: options
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        sendLog(res.took, queryScore, res.hits.total, res.timed_out);
        let result = res.hits.hits.map((ele) => {
          return appendId(ele);
        });
        resolve(result);
      }
    });
  });
};

/**
 * Pulls a random user from the database by generating a random ID to look up
 * @function
 * @instance
 * @returns {Object} A user object
 */
let getRandomUserByNumID = () => {
  return new Promise((resolve, reject) => {
    getCount().then((count) => {
      let ranNum = Math.floor(Math.random() * count);
      return queryByNumericalId(ranNum);
    }).then((data) => {
      // console.dir(data);
      resolve(data);
    }).catch((err) => {
      reject(err);
    });
  });
};

/**
 * Query DB by generated numerical ID
 * @function
 * @param {number} numericalID A generated numerical ID for the user
 * @returns {Object} A User object
 */
let queryByNumericalId = (numericalID) => {
  // console.log('searching numID', numericalID);
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      q: 'numericalID:' + numericalID
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        sendLog(res.took, 0, res.hits.total, res.timed_out);
        resolve(appendId(res.hits.hits[0]));
      }
    });
  });
};

/**
 * Sends a log with query information
 * @function
 * @param {number} took Time the DB took to get data, in milliseconds
 * @param {number} queryScore Number of query conditions in the search
 * @param {number} hits Number of items returned in query
 * @param {boolean} timedOut Whether or not the request timed out
 */
let sendLog = (took, queryScore, hits, timedOut) => {
  logger.logQueryTime({
    took: took,
    queryScore: queryScore,
    hits: hits,
    timedOut: timedOut
  });
}

/**
 * Helper function to get current count of users
 */
let getCount = () => {
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME
    }, function (err, res) {
      if (err) {
        reject(err);
      } else {
        // console.log(res.hits.total);
        resolve(res.hits.total);
      }
    });
  });
};

module.exports = {
  pingServer,
  deleteAllUsers,
  getRandomUser,
  queryByName,
  queryById,
  queryByLocation,
  getRandomUserByNumID
};
