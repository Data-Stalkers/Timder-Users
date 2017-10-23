var elasticsearch = require('elasticsearch');
const generator = require('./generator.js');
const configs = require('../config/config.js');

var client = new elasticsearch.Client({
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
      // deleteAllUsers();
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
      console.log('Deletion success', res);
    }
    // ...
  });
};

let submitNewUser = (n) => {
  // console.log('Set Gender:', faker.name.gender());
  let newUser = generator.constructNewUser();
  console.log('Creating users', newUser);
  client.index({
    index: INDEX_NAME,
    type: USER_TYPE,
    body: newUser
  }, (err, res) => {
    if (err) {
      console.error('Insert error:', err);
    } else {
      console.log('Successful inject:', res);
      if (n > 0) {
        submitNewUser(n - 1);
      }
    }
  });
};

// faker.locale = 'ru';
// submitNewUser(1);
console.dir(generator.constructNewUser());

//body: name, email, gender, location, photoCount, dob, traits

// client.create({
//   index: 'index',
//   type: 'Plastic',
//   body: {
//     title: 'Elastic Plastic',
//     published_at: '2013-01-01',
//     counter: 1
//   }
// }, function (error, response) {
//   console.log(response);
//   process.exit();
//   // ...
// });
