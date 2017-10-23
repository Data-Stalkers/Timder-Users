const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri,
  log: 'trace'
});

const INDEX_NAME = 'userslist';

client.deleteByQuery({
  index: INDEX_NAME
}, function (err, res) {
  if (err) {
    console.err('Deletion error:', err);
  } else {
    console.info('Deletion success', res);
  }
});
