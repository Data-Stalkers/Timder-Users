const request = require('request');
const expect = require('chai').expect;

const URL = 'http://127.0.0.1:3000/user';

describe('server', function() {
  it('should return a 200 status code when GET is made to /user', function(done) {
    request(URL, function(error, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should return a 200 status code when POST is made to /user', function(done) {
    request({ method: 'POST', uri: URL }, function(error, response, body) {
      expect(response.statusCode).to.equal(200);
      done();
    });
  });

  it('should return a user object when sending GET to /user with no queries', function(done) {
    request(URL, function(error, response, body) {
      expect(typeof JSON.parse(body)).to.equal('object');
      done();
    });
  });

  it('Should 404 when asked for a nonexistent endpoint', function(done) {
    request(URL + '/arglebargly', function(error, response, body) {
      expect(response.statusCode).to.equal(404);
      done();
    });
  });
});
