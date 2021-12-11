const PORT = 8080;
const express = require('express');
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

const bcrypt = require('bcryptjs');

const app = express();
app.set("view engine", "ejs");

const {
  getUserByEmail,
  generateRandomString,
  getUserUrls
} = require("./helpers");

//
// DATA
//
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

const userDatabase = {
  "d6e252": {
    userID: 'd6e252',
    email: 'test@test.com',
    // password test
    password: '$2a$10$DVgwkXyAQwkDa2xN37erDe.rQ5S1Tj/cTHde4YUK08MwENYTrMrk.'
  },
  "172b17": {
    userID: '172b17',
    email: '123@123.com',
    //password 123
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

app.use(cookieSession({
  name: 'session',
  keys: ['julia'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


//
// ROUTES (runs when matching run is found)
//

// GET / -> redirects to urls if logged in or else to urls
app.get("/", (req, res) => {
  userID = req.session.user_id;
  if (!userDatabase.userID) {
    return res.redirect("/login");
  } 
   res.redirect("/urls");
});

// GET /urls 
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];
  
  if (!user) {
    return res.status(403).send('Please <a href="/login">Login</a> to see the URLs.');
  }

  const urls = getUserUrls(userID, urlDatabase);
  const templateVars = {urls, user};
  
  res.render("urls_index", templateVars);
});

// GET /urls/new 
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const user = userDatabase[userID];

  if (!user) {
    return res.redirect("/login");
  } 
    const templateVars = { user }
    res.render("urls_new", templateVars);
});

// GET /urls/:shortURL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  const userID = req.session.user_id;
  const user = userDatabase[userID];
  
  if (!user) {
    return res.status(403).send('Please <a href="/login">Login</a> to be able to edit URLs.');
  }

  if (!urlDatabase[shortURL].userID === userID) {
    return res.status(403).send('You are not authorized to edit this URL. <a href="/urls">Return to URLs.</a>.');
  }

  if (!longURL) {
    return res.status(400).send(`URL for given shortURL: "${shortURL}" is not found. Try another one.`);
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

  if (!longURL) {
    return res.status(400).send(`URL for given shortURL: "${shortURL}" is not found. Try another one.`);
  }
  res.redirect(longURL);
});

// POST /urls
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = generateRandomString();

  if (!userDatabase.userID) {
    return res.status(403).send('Please <a href="/login">Login</a> to be able to edit URLs.');
  }

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  return res.redirect(`/urls/${shortURL}`);
});

// POST /urls/:shortURL => Edit
app.post("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;

  if (!userDatabase.userID) {
    return res.status(403).send('Please <a href="/login">Login</a> to be able to edit URLs.');
  }
  
  const expectedUserID = urlDatabase[shortURL].userID
  if (expectedUserID !== userID) {
    return res.status(403).send('You are not authorised to edit this URL. <a href="/urls">Return to URLs</a>.');
  }

  urlDatabase[shortURL].longURL = newLongURL;
  return res.redirect("/urls");
});

// POST /urls/:shortURL/delete => Delete
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;

  if (!userDatabase.userID) {
    return res.status(403).send("You are not authorised to delete a URL");
  }
  
  const expectedUserID = urlDatabase[shortURL].userID
  if (expectedUserID !== userID) {
    return res.status(403).send('You are not authorised to delete this URL. <a href="/urls">Return to URLs.</a>.');
  }
    delete urlDatabase[shortURL];
    return res.redirect("/urls");

});


// GET /login
app.get("/login", (req, res) => {
  const userID = req.session.user_id;

  if (userDatabase.userID) {
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

  if(userID) {
    return res.redirect("/urls");
  }

  return res.render("register", {user: null})
});

// POST '/login'
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Email and / or password cannot be blank. Please <a href="/register"> try again. </a>"');
  }
  const foundUserObject = getUserByEmail(email, userDatabase);

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
  
  if (!email || !password) {
    return res.status(400).send('Email and / or password cannot be blank. Please <a href="/register"> try again. </a>');
  } 
  // checking if email already exists  
  if (getUserByEmail(email, userDatabase)) {
    return res.status(400).send('User with this email address already exists. Please <a href="/register"> try again. </a>')
  }
  // Adding a new user data to the database
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
  req.session = null;
  return res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});