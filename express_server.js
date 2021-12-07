const express = require('express');
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// API (host: 'http://localhost:8080', method: 'GET', path: '/')
app.get("/", (req, res) => {
  res.send("Hello!");
});

// API (host: 'http://localhost:8080', method: 'GET', path: '/urls.json')
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
