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


//
// MIDDLEWARE (runs for every request)
//
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("dev"));
app.use(cookieParser());


//
// ROUTES (runs when matching run is found)
//

// REGISTER 
// API (host: 'http://localhost:8080', method: 'GET', path: '/register')

app.get("/register", (req, res) => {
  res.render("register")
});

// LOGIN => After users enter their username
// API (host: 'http://localhost:8080', method: 'GET', path: '/login')

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

// LOGOUT = > after user clicks logout button
// API (host: 'http://localhost:8080', method: 'GET', path: '/logout')
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});


// My URLs page
// API (host: 'http://localhost:8080', method: 'GET', path: '/urls')

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// Page with create new longURL form
//API (host: 'http://localhost:8080', method: 'GET', path: '/urls/new')

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

// Creating a new LongURL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls')

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/u/${shortURL}`);
});

// Redirect after creating a new LongURL
// API (host: 'http://localhost:8080', method: 'get', path: '/u/:shortURL')

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  if (longURL) {
    const templateVars = {
      username: req.cookies["username"],
      shortURL: shortURL,
      longURL: longURL
    };
    res.render("urls_show", templateVars);
  } else {
    res.send(`URL for given shortURL: "${shortURL}" is not found. Try another one.`);
  }
});


// Edit an existing LongURL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls/:shortURL')

app.post("/urls/:shortURL", (req, res) => {
  // 1. define token
  const shortURL = req.params.shortURL;
  // 2. define new url
  const newLongURL = req.body.longURL;
  // 3. assign new url to token
  urlDatabase[shortURL] = newLongURL;
  // 4. redireck back to /urls
  res.redirect("/urls");
});

// DELETE an existing URL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls/:shortURL/delete')

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Function to Generate a Random ShortURL
function generateRandomString() {
  const generatedShortUrl = Math.random().toString(16).substring(2,8);
  return generatedShortUrl + '.tn';
};



app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});

