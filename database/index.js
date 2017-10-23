const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri,
  log: 'trace'
});

const INDEX_NAME = 'userslist';
const USER_TYPE = 'User';

let pingServer = () => {
  client.ping({}, function (error) {
    if (error) {
      console.trace('Elasticsearch cluster is down!');
    } else {
      console.log('==== All is well ====');
      // submitNewUser(1);
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
