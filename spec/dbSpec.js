const elasticsearch = require('elasticsearch');
const configs = require('../config/config.js');
const expect = require('chai').expect;
const generator = require('../helpers/generator.js');
const dbHelpers = require('../database/index.js');

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

  it ('should be able to search something inserted before', function(done) {
    client.get({
      index: INDEX_NAME,
      type: USER_TYPE,
      id: userId
    }, function (err, res) {
      // console.log(res);
      expect(res._source.name).to.equal(newUser.name);
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

describe('Query helpers', function() {
  let user1, user2;
  it ('should be able to retrieve a random user from db', function(done) {
    dbHelpers.getRandomUser().then((data) => {
      user1 = data;
      return dbHelpers.getRandomUser();
    }).then((data) => {
      user2 = data;
      expect(user1.name).to.not.equal(user2.name);
      done();
    })
  });

  it ('should be able to retrieve a random user from db with numeric ID', function(done) {
    dbHelpers.getRandomUserByNumID().then((data) => {
      user1 = data;
      return dbHelpers.getRandomUserByNumID();
    }).then((data) => {
      user2 = data;
      expect(user1.name).to.not.equal(user2.name);
      done();
    })
  });

  it ('should be able to search pre-existing user by name', function(done) {
    dbHelpers.queryByName(user1.name).then((data) => {
      expect(user1.name).to.equal(data.name);
      done();
    });
  });

  it('should be able to search by ID', function(done) {
    dbHelpers.queryById(user1.id).then((data) => {
      expect(data.name).to.equal(user1.name);
      done();
    });
  });

  it('should return an array of users when queried by location', function(done) {
    dbHelpers.queryByLocation({location: 'A'}).then((data) => {
      // console.dir(data);
      expect(data.length).to.be.above(1);
      expect(typeof data[0].name).to.equal('string');
      done();
    });
  });

  it('should not include a gender in location query if it is filtered out', function(done) {
    let queryGender = 'F';
    dbHelpers.queryByLocation({location: 'A', genderFilter: queryGender}).then((data) => {
      // console.dir(data);
      for (var ele of data) {
        expect(ele.gender).to.equal('F');
      }
      expect(data.length).to.be.above(1);
      expect(typeof data[0].name).to.equal('string');
      done();
    });
  });

  it('should not include a user ID in location query if it is filtered out', function(done) {
    let queryLocation = user1.location;
    let queryId = user1.id;
    dbHelpers.queryByLocation({location: queryLocation, userFilter: [queryId, user2.id]}).then((data) => {
      // console.dir(data);
      for (var ele of data) {
        expect(ele.id).to.not.equal(queryId);
      }
      expect(data.length).to.be.above(0);
      expect(typeof data[0].name).to.equal('string');
      done();
    });
  });

  it ('should query users by photo count', function(done) {
    let queryPhotoCount = '3';
    dbHelpers.queryByLocation({location: 'A', photoCount: queryPhotoCount}).then((data) => {
      // console.dir(data);
      for (var ele of data) {
        expect(ele.photoCount).to.equal(3);
      }
      expect(data.length).to.be.above(1);
      // expect(typeof data[0].name).to.equal('string');
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
