const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri
});

const INDEX_NAME = 'userslist';
const USER_TYPE = 'User';
const QUERY_SIZE = 50;

let appendId = (obj) => {
  let result = obj._source;
  result.id = obj._id;
  return result;
};

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
        resolve(appendId(res.hits.hits[0]));
      }
    });
  });
};

let queryByName = (name) => {
  return new Promise((resolve, reject) => {
    client.search({
      index: INDEX_NAME,
      q: 'name:' + name
    }, function(err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(appendId(res.hits.hits[0]));
      }
    });
  });
};

/* Return Example:
{ name: 'Destiney Pagac',
    email: 'Destiney.Pagac79@gmail.com',
    gender: 'F',
    location: 'E',
    photoCount: 2,
    dob: 1994,
    traits: '["Brown Eyes","Dyed Hair","Edgy"]',
    id: 'AV9QdtXQnjGSTgtGtCuL' },
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

let queryByLocation = (input) => {
  let options = { query: {
    bool: {
      must: [
        { match: { location: input.location } }
      ]
    }
  }};
  if (input.genderFilter) {
    options.query.bool.must.push({ match: { gender: input.genderFilter } });
  }
  if (input.userFilter) {
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
        let result = res.hits.hits.map((ele) => {
          return appendId(ele);
        });
        resolve(result);
      }
    });
  });
};

//Returns array of user objects

module.exports = {
  pingServer,
  deleteAllUsers,
  getRandomUser,
  queryByName,
  queryById,
  queryByLocation
};
