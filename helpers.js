// Function to check if user is logged in
const isUserLoggedin = function(cookie, userDatabase) {
  for (const user in userDatabase) {
    if (cookie === user) {
      return true;
    }
  } return false;
};

    // function to check if email already exists in user database

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
        if (urlDatabase[shortURL].userID === id) {
          usersUrls[shortURL] = urlDatabase[shortURL];
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
      isUserLoggedin,
      getUserUrls
    };