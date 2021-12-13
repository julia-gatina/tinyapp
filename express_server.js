const PORT = 8080;
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();
app.set("view engine", "ejs");

const { urlDatabase } = require("./data/urlDatabase");
const { userDatabase } = require("./data/userDatabase");
const { getUserByEmail, generateRandomString, getUserUrls, doesURLbelongToUser } = require("./helpers");


//
// MIDDLEWARE (runs for every request)
//
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['julia'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


//
// ROUTES (a route runs when matching run is found)
//

// GET / -> redirects to urls if logged in or else prompts to login
app.get("/", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];

  if (!user) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

// GET /urls (only for logged in users)
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];

  // if user is not logged in, app sends a msg to log in and will not show URLs
  if (!user) {
    return res.status(403).send('Please <a href="/login">Login</a> to see the URLs.');
  }

  const urls = getUserUrls(userID);
  const templateVars = {
    urls,
    user
  };
  res.render("urls_index", templateVars);
});

// GET /urls/new (only for logged in users)
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];

  // check is user is logged in, if not -> redirect to login page
  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});

// GET /urls/:shortURL (only for logged in users)
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const userID = req.session.user_id;
  const user = userDatabase[userID];

  //If user not logged in, display a message to log in
  if (!user) {
    return res.status(403).send('Please <a href="/login">Login</a> to be able to edit URLs.');
  }

  // check is this url belongs to logged in user
  if(!doesURLbelongToUser(userID, shortURL)) {
    return res.status(403).send('You are not authorized to perform actions on this URL. <a href="/urls">Return to URLs.</a>.');
  }

  const templateVars = {
    user: user,
    shortURL: shortURL,
    longURL: longURL
  };
  res.render("urls_show", templateVars);
});

// GET /u/:shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const userID = req.params.shortURL;

  // error if URL is not found
  if (!longURL || !shortURL) {
    return res.status(400).send(`URL for given shortURL: "${shortURL}" is not found. Try another one.`);
  }

  // check is this url belongs to logged in user
  if(!doesURLbelongToUser(userID, shortURL)) {
    return res.status(403).send('You are not authorized to perform actions on this URL. <a href="/urls">Return to URLs.</a>.');
  }

  res.redirect(longURL);
});

// POST /urls (only for logged in users)
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];
  const shortURL = generateRandomString();

  // check if user is logged in
  if (!user) {
    return res.status(403).send('Please <a href="/login">Login</a> to be able to edit URLs.');
  }

  //add new URL to database
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userID
  };
  return res.redirect(`/urls/${shortURL}`);

});

// POST /urls/:shortURL => Edit (only for logged in users)
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;

  // check is user is logged in
  if (!user) {
    return res.status(403).send('Please <a href="/login">Login</a> to be able to edit URLs.');
  }

  // check is this url belongs to logged in user
  if(!doesURLbelongToUser(userID, shortURL)) {
    return res.status(403).send('You are not authorized to perform actions on this URL. <a href="/urls">Return to URLs.</a>.');
  }

  urlDatabase[shortURL].longURL = newLongURL;
  return res.redirect("/urls");
});

// POST /urls/:shortURL/delete => Delete (only for logged in users)
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];
  const shortURL = req.params.shortURL;

  // check if user is logged in
  if (!user) {
    return res.status(403).send('Please <a href="/login">Login</a> to be able to delete URLs.');
  }

  // check is this url belongs to logged in user
  if(!doesURLbelongToUser(userID, shortURL)) {
    return res.status(403).send('You are not authorized to perform actions on this URL. <a href="/urls">Return to URLs.</a>.');
  }

  delete urlDatabase[shortURL];
  return res.redirect("/urls");

});

// GET /login
app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];

  // if user is already logged in, redirect to /urls page
  if (user) {
    return res.redirect("/urls");
  }

  const templateVars = {
    user: userDatabase[userID],
    urls: urlDatabase[userID]
  };
  res.render("login", templateVars);
});

// GET /register
app.get("/register", (req, res) => {
  const userID = req.session.user_id;

  // if users already logged in redirect to /urls
  if (userID) {
    return res.redirect("/urls");
  }
  return res.render("register", {
    user: null
  })
});

// POST '/login'
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if email or password empty
  if (!email || !password) {
    return res.status(400).send('Email and / or password cannot be blank. Please <a href="/register"> try again. </a>');
  }
  const foundUserObject = getUserByEmail(email);

  // check if email and password match
  if (!foundUserObject || !bcrypt.compareSync(password, foundUserObject.password)) {
    return res.status(403).send('Unvalid credentials. Please <a href="/login">try again.</a>');
  }

  req.session.user_id = foundUserObject.userID;
  res.redirect("/urls");
});


// POST /register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // check if email or password empty
  if (!email || !password) {
    return res.status(400).send('Email and / or password cannot be blank. Please <a href="/register"> try again. </a>');
  }

  // check if this email already exists
  if (getUserByEmail(email)) {
    return res.status(400).send('User with this email address already exists. Please <a href="/register"> try again. </a>')
  }

  const newUserID = generateRandomString();
  userDatabase[newUserID] = {
    userID: newUserID,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  req.session.user_id = newUserID;
  res.redirect("/urls");
});


// POST /logout
app.post("/logout", (req, res) => {
  // clear cookies
  req.session = null;
  return res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});