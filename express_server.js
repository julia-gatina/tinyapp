const PORT = 8080;
const express = require('express');
const morgan = require("morgan"); // => prints every request status etc to the console
const bodyParser = require("body-parser");

const app = express();
app.set("view engine", "ejs");



//
// DATA
//

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};


//
// MIDDLEWARE (runs for every request)
//
app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan("dev"));


//
// ROUTES (runs when matching run is found)
//


// API (host: 'http://localhost:8080', method: 'GET', path: '/urls')
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

// a GET Route to Show the Form, path /urls/new
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//a route for POST request, url entered via the form and generated shortUrl added to urls database;
app.post("/urls", (req, res) => {
  const urlToken = generateRandomString();
  urlDatabase[urlToken] = req.body.longURL;
  res.redirect(`/u/${urlToken}`);
});

app.get("/u/:urlToken", (req, res) => {
  const urlToken = req.params.urlToken;
  const longURL = urlDatabase[urlToken];

  if (longURL) {
    const templateVars = {
      shortURL: urlToken,
      longURL: longURL
    };
    res.render("urls_show", templateVars);
  } else {
    res.send(`URL for given token: "${urlToken}" is not found. Try another one.`);
  }
});

// API (host: 'http://localhost:8080', method: 'POST', path: '/urls/:urlToken')
app.post("/urls/:urlToken", (req, res) => {
  // 1. define token
  const urlToken = req.params.urlToken;
  // 2. define new url
  const newLongURL = req.body.longURL;
  // 3. assign new url to token
  urlDatabase[urlToken] = newLongURL;
  // 4. redireck back to /urls
  res.redirect("/urls");
});

app.post("/urls/:urlToken/delete", (req, res) => {
  const urlToken = req.params.urlToken;
  delete urlDatabase[urlToken];
  res.redirect("/urls");
});

// Generate a Random ShortURL
function generateRandomString() {
  const generatedShortUrl = Math.random().toString(16).substring(2,8);
  return generatedShortUrl;
  
}


// API (host: 'http://localhost:8080', method: 'GET', path: '/urls/:shortURL')



app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});

