const res = require("express/lib/response");
const { userDatabase } = require("./data/userDatabase");
const { urlDatabase } = require("./data/urlDatabase");

// function to fetch user data from database by email, returns whole user object.

const getUserByEmail = function(email) {
  for (const key in userDatabase) {
    console.log("this is key - :", key)
    const user = userDatabase[key];
    if (user.email === email) {
      //returns whole user object
      return user;
    }
  }
  return null;
};

// Function to get URLs that belong to a certain user, returns an object.
const getUserUrls = function(id) {
  const usersUrls = {};

  for (const shortURL in urlDatabase) {
    const urlObj = urlDatabase[shortURL]
    if (urlObj.userID === id) {
      usersUrls[shortURL] = urlObj;
    }
  }
  return usersUrls;
};

// Function to Generate a Random ShortURL (used for shortURLs and user IDs)
const generateRandomString = function() {
  const generatedRandomString = Math.random().toString(16).substring(2, 8);
  return generatedRandomString;
};


module.exports = {
  getUserByEmail,
  generateRandomString,
  getUserUrls
};