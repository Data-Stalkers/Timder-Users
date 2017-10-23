const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');
const expect = require('chai').expect;
const generator = require('../helpers/generator.js');

const client = new elasticsearch.Client({
  host: configs.elasticUri
});

const INDEX_NAME = 'userslist';
const USER_TYPE = 'User';

describe('AWS Elastic Search server', function () {
  it ('should reply to pings', function(done) {
    client.ping({}, function (error) {
      if (error) {
        console.trace('Elasticsearch cluster is down!');
      } else {
        // console.log('==== All is well ====');
        // submitNewUser(1);
        done();
      }
    });
  });

  let newUser = generator.constructNewUser();
  let userId;
  it ('should post a new user to the database', function(done) {
    client.index({
      index: INDEX_NAME,
      type: USER_TYPE,
      body: newUser
    }, (err, res) => {
      expect(res.result).to.equal('created');
      userId = res._id;
      // console.log(res);
      done();
    });
  });

  it ('should delete from the database', function(done) {
    client.delete({
      index: INDEX_NAME,
      type: USER_TYPE,
      id: userId
    }, function (err, res) {
      expect(res.found).to.equal(true);
      done();
    });
  });
});

describe('Fake User Generation', function() {
  let user;

  beforeEach(function(done) {
    user = generator.constructNewUser();
    done();
  });

  it ('should create a user with a name', function(done) {
    expect(typeof user.name).to.equal('string');
    done();
  });

  it ('should create a traits array that can be parsed', function(done) {
    let result = JSON.parse(user.traits);
    expect(result).to.be.an('array');
    done();
  });

  it ('should create a birthyear resulting in an age less than 80', function(done) {
    let d = new Date();
    let age = d.getFullYear() - user.dob;
    expect(age).to.be.below(80);
    done();
  });
});
