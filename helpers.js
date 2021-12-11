const res = require("express/lib/response");

// Function to check if user is logged in
const isUserLoggedIn = function(userID, userDatabase) {
  for (const key in userDatabase) {
    if (key === userID) {
      return true;
    } 
    return false;
  }
}

// function to fetch user data from database by email

const getUserByEmail = function(email, userDatabase) {
  for (const key in userDatabase) {
    const user = userDatabase[key];
    if (user.email === email) {
      //returns whole user object
      return user;
    }
  }
  return null;
};

// Function to 
const getUserUrls = function(id, urlDatabase) {
  const usersUrls = {};

  for (const shortURL in urlDatabase) {
    const urlObj = urlDatabase[shortURL]
    if (urlObj.userID === id) {
      usersUrls[shortURL] = urlObj;
    }
  }
  return usersUrls;
};

// Function to Generate a Random ShortURL (used for shortURL and user ids)

const generateRandomString = function() {
  const generatedRandomString = Math.random().toString(16).substring(2, 8);
  return generatedRandomString;
};


module.exports = {
  getUserByEmail,
  generateRandomString,
  isUserLoggedIn,
  getUserUrls
};