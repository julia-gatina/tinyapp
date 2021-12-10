const PORT = 8080;
const express = require('express');
const morgan = require("morgan"); // => prints every request status etc to the console
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const bcrypt = require('bcryptjs');

const app = express();
app.set("view engine", "ejs");



//
// DATA
//
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "d00fe9"
  },
  e99551: {
    longURL: "https://www.w3schools.com",
    userID: '172b17'
  }
};


const userDatabase = {
  "d00fe9": {
    userID: "d00fe9",
    email: "tes@test.com",
    password: "abc"
  },
  '172b17': {
    userID: '172b17',
    email: '123@123.com', //password 123
    password: '$2a$10$ADVm5tdjMvLf/XOJ9tfQ7u0iVJzGFwOHgZVy8a4j8WE5GpAqvFhke'
  }

};

//
// MIDDLEWARE (runs for every request)
//
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(morgan("dev"));
app.use(cookieParser());


//
// ROUTES (runs when matching run is found)
//

// REGISTER 
// API (host: 'http://localhost:8080', method: 'GET', path: '/register')

app.get("/register", (req, res) => {
  const userID = req.cookies.userID;
  const templateVars = {
    user: userDatabase[userID],
    urls: urlDatabase
  };
  res.render("register", templateVars)
});

// Register => after user enters email and password
// // API (host: 'http://localhost:8080', method: 'POST', path: '/register')
app.post("/register", (req, res) => {
  const newID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  // checking if email or passwords blank
  if (!email || !password) {
    return res.status(400).send("Email and / or password cannot be blank. Please try again.");
    // checking if email already exists  
  } else if (userLookupByEmail(email)) {
    return res.status(400).send("User with this email address already exists.")
  }
  // Adding a new user data to the database
  userDatabase[newID] = {
    userID: newID,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  res.cookie("userID", newID)
  res.redirect("/urls")
  console.log(userDatabase);

});

// LOGIN 
// API (host: 'http://localhost:8080', method: 'Get', path: '/login')
app.get("/login", (req, res) => {
  const userID = req.cookies.userID;
  const templateVars = {
    user: userDatabase[userID],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});


// LOGIN => After users enter their email and password
// API (host: 'http://localhost:8080', method: 'POST', path: '/login')

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Email and / or password cannot be blank. Please try again.");
  }
  const foundUserObject = userLookupByEmail(email);

  if (!foundUserObject) {
    return res.status(403).send("This email is not found.");
  }
  // check password
  if (bcrypt.compareSync(password, foundUserObject.password)) {
    res.cookie("userID", foundUserObject.userID)
    res.redirect("/urls");
  } else {
    return res.status(403).send("Wrong password, please try again.")
  }

});

// LOGOUT = > after user clicks logout button
// API (host: 'http://localhost:8080', method: 'POST', path: '/logout')
app.post("/logout", (req, res) => {
  res.clearCookie('userID');
  res.redirect("login");
});


// My URLs page
// API (host: 'http://localhost:8080', method: 'GET', path: '/urls')

app.get("/urls", (req, res) => {
  const userID = req.cookies.userID;
  urls = urlsForUserID(userID);
  const templateVars = {
    user: userDatabase[userID],
    urls: urls
  };
  res.render("urls_index", templateVars);
});

// Page with create new longURL form
//API (host: 'http://localhost:8080', method: 'GET', path: '/urls/new')

app.get("/urls/new", (req, res) => {
  const userID = req.cookies.userID;
  if (isUserLoggedin(req, res));
  const templateVars = {
    user: userDatabase[userID],
  };
  res.render("urls_new", templateVars);
});

// Creating a new LongURL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls')

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies.userID
  }
  res.redirect(`/u/${shortURL}`);
});

// Redirect after creating a new LongURL
// API (host: 'http://localhost:8080', method: 'get', path: '/u/:shortURL')

app.get("/u/:shortURL", (req, res) => {
  if (isUserLoggedin(req, res));
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;

  if (longURL) {
    const userID = req.cookies.userID;
    const templateVars = {
      user: userDatabase[userID],
      shortURL: shortURL,
      longURL: longURL
    };
    res.render("urls_show", templateVars);
  } else {
    return res.status(400).send(`URL for given shortURL: "${shortURL}" is not found. Try another one.`);
  }
});


// Edit an existing LongURL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls/:shortURL')

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("/urls");
});

// DELETE an existing URL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls/:shortURL/delete')

app.post("/urls/:shortURL/delete", (req, res) => {
  if (isUserLoggedin(req, res));
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");

});

// Helper FUNCTIONS
// Function to Generate a Random ShortURL (used for shortURL and user ids)

const generateRandomString = function() {
  const generatedRandomString = Math.random().toString(16).substring(2, 8);
  return generatedRandomString;
};

// function to check if email already exists in user database

const userLookupByEmail = function(email) {
  for (const key in userDatabase) {
    const dbEntry = userDatabase[key];
    if (dbEntry.email === email) {
      //returns whole user object
      return dbEntry;
    }
  }
  return null;
};

// Function to check if user is logged in
const isUserLoggedin = (req, res) => {
  const userID = req.cookies.userID;
  if (userID) {
    return true;
  } else {
    return res.redirect("/login");
  }
};

const urlsForUserID = function(userID) {
  let userUrls = {};
  for (const key in urlDatabase) {
    if (userID === urlDatabase[key].userID) {
      shortURL = urlDatabase[key];
      longURL = urlDatabase[key].longURL;
      userUrls = {
        shortURL,
        longURL
      };
    }
  }
  return userUrls;
};

app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});

// app.post("/urls/:id", (req, res) => {
//   const userID = req.session.userID;
//   const userUrls = urlsForUser(userID, urlDatabase);
//   if (Object.keys(userUrls).includes(req.params.id)) {
//     const shortURL = req.params.id;
//     urlDatabase[shortURL].longURL = req.body.newURL;
//     res.redirect('/urls');
//   } else {
//     res.status(401).send("You do not have authorization to edit this short URL.");
//   }
// });