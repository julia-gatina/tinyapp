const { assert } = require('chai');

const { getUserByEmail, getUserUrls } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};


describe('Function getUserByEmail', function() {
  it('should return a user object containing a valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUser = testUsers.userRandomID;
    assert.equal(user, expectedUser);
  });

  it('shour return "undefined" if passed an email that does not exists in the database', function() {
    const actual = getUserByEmail("test@email.com", testUsers);
    const expected = undefined;
    assert.equal(actual, expected);
  })  
});
