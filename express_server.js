const PORT = 8080;
const express = require('express');
const morgan = require("morgan"); // => prints every request status etc to the console
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
app.set("view engine", "ejs");



//
// DATA
//

const urlDatabase = {
  "b2xVn2.tn": "http://www.lighthouselabs.ca",
  "9sm5xK.tn": "http://www.google.com"
};

const userDatabase = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "123"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "abc"
  },
  "d00fe9": { 
    id: 'd00fe9',
    email: 'aaaa@123.com',
    password: '123456' 
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
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: userDatabase[user_id],
    urls: urlDatabase
  };
  res.render("register", templateVars)
});

// Register => after user enters email and password
// // API (host: 'http://localhost:8080', method: 'POST', path: '/register')
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  // checking if email or passwords blank
  if (!email || !password) {
    return res.status(400).send("email and password cannot be blank");
  // checking if email already exists  
  } else if (userLookupByEmail(email)) {
    return res.status(400).send("User with this email address already exists.")
  }

  // Adding a new user data to the database
  userDatabase[id] = {
    id: id,
    email: email,
    password: password
  };
  res.cookie("user_id", id)
  res.redirect("/urls")
  
});

// LOGIN 
// API (host: 'http://localhost:8080', method: 'Get', path: '/login')
app.get("/login", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: userDatabase[user_id],
    urls: urlDatabase
  };
  res.render("login", templateVars);
});


// LOGIN => After users enter their email
// API (host: 'http://localhost:8080', method: 'POST', path: '/login')

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("Email: ", email)
  console.log("Password: ", password);
  if (!email || !password) {
    return res.status(400).send("email and password cannot be blank");
  }

  const foundUserObject = userLookupByEmail(email);

  if (!foundUserObject) {
    return res.status(403).send("This email is not found.");
  }
    // check password
    if (foundUserObject.password === password) {
      console.log("Found user object: ", foundUserObject);
      res.cookie("user_id", foundUserObject.id)
      res.redirect("/urls");
    } else {
      return res.status(403).send("Wrong password, please try again.")
    }

});

// LOGOUT = > after user clicks logout button
// API (host: 'http://localhost:8080', method: 'POST', path: '/logout')
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("login");
});


// My URLs page
// API (host: 'http://localhost:8080', method: 'GET', path: '/urls')

app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: userDatabase[user_id],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Page with create new longURL form
//API (host: 'http://localhost:8080', method: 'GET', path: '/urls/new')

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const templateVars = {
    user: userDatabase[user_id],
  };
  res.render("urls_new", templateVars);
});

// Creating a new LongURL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls')

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString() + '.tn';
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/u/${shortURL}`);
});

// Redirect after creating a new LongURL
// API (host: 'http://localhost:8080', method: 'get', path: '/u/:shortURL')

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    const cookie = req.cookies.user_id;
    const templateVars = {
      user: userDatabase[cookie],
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
  urlDatabase[shortURL] = newLongURL;
  res.redirect("/urls");
});

// DELETE an existing URL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls/:shortURL/delete')

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Helper FUNCTIONS
// Function to Generate a Random ShortURL (used for shortURL and user ids)

const generateRandomString = function() {
  const generatedShortUrl = Math.random().toString(16).substring(2, 8);
  return generatedShortUrl;
};

// function to check if email already exists in user database

const userLookupByEmail = function(email) {
  for (const key in userDatabase) {
    const dbEntry = userDatabase[key];
    if (dbEntry.email === email) {
      return dbEntry;
    }
  }
  return null;
};


app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});