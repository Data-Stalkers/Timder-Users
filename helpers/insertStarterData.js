const elasticsearch = require('elasticsearch');
const generator = require('./generator.js');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri
});

const INDEX_NAME = 'userslist';
const USER_TYPE = 'User';
const NUM_TO_INSERT = 500000;
const BULK_AMOUNT = 10000;

let pingServer = () => {
  client.ping({}, function (error) {
    if (error) {
      console.trace('Elasticsearch cluster is down!');
    } else {
      console.log('==== All is well ====');
      // submitNewUser(NUM_TO_INSERT);
      bulkSubmit(NUM_TO_INSERT);
    }
  });
};

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

let bulkSubmit = (n = NUM_TO_INSERT, c = 0) => {
  let submitArray = [];
  for (var i = 0; i < BULK_AMOUNT; i++) {
    let newUser = generator.constructNewUser();

    let userMethod = {
      'index': {
        _index: INDEX_NAME,
        _type: USER_TYPE
      }
    };

    if ((i + 1) % 100 === 0) console.log('Created', i, 'of', BULK_AMOUNT, 'in batch');

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

let submitNewUser = (n, c = 0) => {
  if (n === 0) return;
  let newUser = generator.constructNewUser();
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

// deleteAllUsers();

pingServer();

module.exports = {
  pingServer
};


// console.dir(generator.constructNewUser());
