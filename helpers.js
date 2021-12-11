const res = require("express/lib/response");

// function to fetch user data from database by email, returns whole user object.

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

const urlDatabase = {
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "d6e252"
  },
  e99551: {
    longURL: "https://www.w3schools.com",
    userID: '172b17'
  }
};

// Function to get URLs that belong to a certain user, returns an object.
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