const elasticsearch = require('elasticsearch');
const generator = require('./generator.js');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri
});

let count = 0;

/** @module */

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
 * The number of users to insert into the database
 * @constant
*/
const NUM_TO_INSERT = 3000000;
/**
 * Amount of users to generate before submitting to the database.
 * Seems to work best under 10,000
 * @constant
*/
const BULK_AMOUNT = 10000;

/**
 * Pings the server and if there's no error, begins insertion
 * @function
 */
let pingServer = () => {
  client.ping({}, function (error) {
    if (error) {
      console.trace('Elasticsearch cluster is down!');
    } else {
      console.log('==== All is well ====');
      // submitNewUser(NUM_TO_INSERT);
      getCount().then((data) => {
        count = data;
        bulkSubmit(NUM_TO_INSERT);
      });
    }
  });
};

/**
 * Deletes all the users in the database
 * @function
 */
let deleteAllUsers = () => {
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

/**
 * Submits in bulk, BULK_AMOUNT number of users until NUM_TO_INSERT is reached.
 * @function
 * @param {number} n The number of users to insert. Should be more than BULK_AMOUNT
 */
let bulkSubmit = (n = NUM_TO_INSERT, c = 0) => {
  if (n < BULK_AMOUNT) console.error('Why even use the bulk submitter');

  let submitArray = [];
  for (var i = 0; i < BULK_AMOUNT; i++) {
    let newUser = generator.constructNewUser();
    newUser.numericalID = c + i + count;
    let userMethod = {
      'index': {
        _index: INDEX_NAME,
        _type: USER_TYPE
      }
    };
    if ((i + 1) % 100 === 0) console.log('Created', i + 1, 'of', BULK_AMOUNT, 'in batch');
    submitArray.push(userMethod);
    submitArray.push(newUser);
  }
  console.log('=== Submitting entries up to', c + BULK_AMOUNT, 'of', NUM_TO_INSERT);
  client.bulk({
    body: submitArray
  }, (err, res) => {
    if (err) {
      console.error('Insert error:', err);
    } else {
      console.info('Submitted', c + BULK_AMOUNT, 'users of target', NUM_TO_INSERT);
      if (n - BULK_AMOUNT > 0) {
        bulkSubmit(n - BULK_AMOUNT, c + BULK_AMOUNT);
      }
    }
  });
}

/**
 * Submits one by one until NUM_TO_INSERT is reached.
 * @function
 * @param {number} n The number of users to submit
 */
let submitNewUser = (n, c = 0) => {
  if (n === 0) return;
  let newUser = generator.constructNewUser();
  newUser.numericalID = c + count;
  client.index({
    index: INDEX_NAME,
    type: USER_TYPE,
    body: newUser
  }, (err, res) => {
    if (err) {
      console.error('Insert error:', err);
    } else {
      console.info('#' + c + ':', 'Created user', newUser.name, '- born', newUser.dob, '- Users to go:', n - 1);
      if (n > 0) {
        submitNewUser(n - 1, c + 1);
      }
    }
  });
};

let getCount = () => {
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME
    }, function (err, res) {
      if (err) {
        reject(err);
      } else {
        console.log(res.hits.total);
        resolve(res.hits.total);
      }
    });
  });
};

pingServer();

module.exports = {
  pingServer
};


// console.dir(generator.constructNewUser());
