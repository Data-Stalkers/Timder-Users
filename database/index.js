const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri
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
  return new Promise((resolve, reject) => {
    client.deleteByQuery({
      index: INDEX_NAME
    }, function (err, res) {
      if (err) {
        // console.err('Deletion error:', err);
        reject(err);
      } else {
        resolve(res);
        // console.info('Deletion success', res);
      }
    });
  });
};

let getRandomUser = () => {
  let a = new Date().getTime().toString();
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      size: 1,
      body: {query: {
        function_score: {
          random_score: { seed: a }
        }
      }}
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res.hits.hits[0]._source);
      }
      // console.log(res.hits.hits[0]._source);
    });
  });
};

module.exports = {
  pingServer,
  deleteAllUsers,
  getRandomUser
};
