const elasticsearch = require('elasticsearch');
const generator = require('./generator.js');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri
});

const INDEX_NAME = 'userslist';
const USER_TYPE = 'User';
const NUM_TO_INSERT = 100000;

let pingServer = () => {
  client.ping({}, function (error) {
    if (error) {
      console.trace('Elasticsearch cluster is down!');
    } else {
      console.log('==== All is well ====');
      submitNewUser(NUM_TO_INSERT);
    }
  });
};

let deleteAllUsers = () => {
  client.deleteByQuery({
    index: INDEX_NAME
  }, function (err, res) {
    if (err) {
      console.err('Deletion error:', err);
    } else {
      console.info('Deletion success', res);
    }
  });
};

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
