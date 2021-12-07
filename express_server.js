const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// API (host: 'http://localhost:8080', method: 'GET', path: '/urls.json')
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// API (host: 'http://localhost:8080', method: 'GET', path: '/urls')
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// a GET Route to Show the Form, path /urls/new
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//testing POST request, url entered via the form
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

// API (host: 'http://localhost:8080', method: 'GET', path: '/urls/:shortURL')
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  const templateVars = { shortURL: shortURL, longURL: longURL};
  res.render("urls_show", templateVars);
});



app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});
