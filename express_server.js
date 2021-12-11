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
  isUserLoggedIn,
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

// Root directory -> redirects to urls if logged in or else to urls
app.get("/", (req, res) => {
  userID = req.session.user_id;
  if (!isUserLoggedIn(userID, userDatabase)) {
    return res.redirect("/login");
  } 
   res.redirect("/urls");
});

// REGISTER 
// API (host: 'http://localhost:8080', method: 'GET', path: '/register')

app.get("/register", (req, res) => {
  const userID = [req.session.user_id];
  const templateVars = {
    user: userDatabase[userID],
    urls: urlDatabase
  };
  return res.render("register", templateVars)
});

// Register => after user enters email and password
// // API (host: 'http://localhost:8080', method: 'POST', path: '/register')
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // checking if email or passwords blank
  if (!email || !password) {
    return res.status(400).send('Email and / or password cannot be blank. Please <a href="/register"> try again. </a>"');
  } 
  // checking if email already exists  
  if (getUserByEmail(email, userDatabase)) {
    return res.status(400).send('User with this email address already exists. Please <a href="/register"> try again. </a>"')
  }
  // Adding a new user data to the database
  const newID = generateRandomString();
  userDatabase[newID] = {
    userID: newID,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  req.session.user_id = "userID";
  res.redirect("/urls");
});

// LOGIN 
// API (host: 'http://localhost:8080', method: 'Get', path: '/login')
app.get("/login", (req, res) => {
  const userID = [req.session.user_id];
  const templateVars = {
    user: userDatabase[userID],
    urls: urlDatabase[userID]
  };
  res.render("login", templateVars);
});


// LOGIN => After users enter their email and password
// API (host: 'http://localhost:8080', method: 'POST', path: '/login')

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Email and / or password cannot be blank. Please <a href="/register"> try again. </a>"');
  }
  const foundUserObject = getUserByEmail(email, userDatabase);

  if (!foundUserObject) {
    return res.status(403).send('Unvalid credentials. Please <a href="/register"> try again. </a>"');
  }
  // check password
  if (bcrypt.compareSync(password, foundUserObject.password)) {
    req.session.user_id = foundUserObject.userID;
    res.redirect("/urls");
  } else {
    return res.status(403).send('Wrong password. Please <a href="/register"> try again. </a>"')
  }

});

// LOGOUT = > after user clicks logout button
// API (host: 'http://localhost:8080', method: 'POST', path: '/logout')
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/urls");
});


// My URLs page
// API (host: 'http://localhost:8080', method: 'GET', path: '/urls')

app.get("/urls", (req, res) => {
  const userID = [req.session.user_id];
  const user = userDatabase[userID];
  
  if (!user) {
    return res.status(403).send('Please <a href="/login">Login</a> to see the URLs"');
  }

  const urls = getUserUrls(userID);
  const templateVars = {urls, user};
  
  res.render("urls_index", templateVars);
});

// Page with create new longURL form
//API (host: 'http://localhost:8080', method: 'GET', path: '/urls/new')

app.get("/urls/new", (req, res) => {
  const userID = [req.session.user_id];
  if (isUserLoggedIn(userID, userDatabase)) {
    const templateVars = {
      user: userDatabase[userID],
    }
    res.render("urls_new", templateVars);
  } else {
    res.send("not working right")
  }
});

// Creating a new LongURL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls')

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: [req.session.user_id]
  }
  return res.redirect(`/u/${shortURL}`);
});

// Redirect after creating a new LongURL
// API (host: 'http://localhost:8080', method: 'get', path: '/u/:shortURL')

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;

  if (longURL) {
    const userID = [req.session.user_id];
    const templateVars = {
      user: userDatabase[userID],
      shortURL: shortURL,
      longURL: longURL
    };
    res.render("urls_show", templateVars);
  } else {
    return res.status(400).send(`URL for given shortURL: "${shortURL}" is not found. Try another one.`)
  }
});


// Edit an existing LongURL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls/:shortURL')

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newLongURL;
  return res.redirect("/urls");
});

// DELETE an existing URL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls/:shortURL/delete')

app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = [req.session.user_id];
  if (isUserLoggedIn(userID, userDatabase)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  } else {
    return res.status(403).send("You are not authorised to delete a URL");
  }

});


app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});