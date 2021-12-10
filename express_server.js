const PORT = 8080;
const express = require('express');
const morgan = require("morgan"); // => prints every request status etc to the console
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

const bcrypt = require('bcryptjs');

const app = express();
app.set("view engine", "ejs");

const { getUserByEmail, generateRandomString, isUserLoggedin, getUserUrls } = require("./helpers");

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
  if (isUserLoggedin(userID, userDatabase)) {
    res.redirect("/urls");
  } else {
    return res.redirect("login");
  }
});

// REGISTER 
// API (host: 'http://localhost:8080', method: 'GET', path: '/register')

app.get("/register", (req, res) => {
  const userID = userDatabase[req.session.user_id];
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
  } else if (getUserByEmail(email, userDatabase)) {
    return res.status(400).send("User with this email address already exists.")
  }
  // Adding a new user data to the database
  userDatabase[newID] = {
    userID: newID,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  req.session.user_id = "userID";
  res.redirect("/urls")
  console.log(userDatabase);

});

// LOGIN 
// API (host: 'http://localhost:8080', method: 'Get', path: '/login')
app.get("/login", (req, res) => {
  const user = userDatabase[req.session.user_id];
  const templateVars = {
    user: user,
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
  const foundUserObject = getUserByEmail(email, userDatabase);

  if (!foundUserObject) {
    return res.status(403).send("This email is not found.");
  }
  // check password
  if (bcrypt.compareSync(password, foundUserObject.password)) {
    req.session.user_id = foundUserObject.userID;
    res.redirect("/urls");
  } else {
    return res.status(403).send("Wrong password, please try again.")
  }

});

// LOGOUT = > after user clicks logout button
// API (host: 'http://localhost:8080', method: 'POST', path: '/logout')
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("login");
});


// My URLs page
// API (host: 'http://localhost:8080', method: 'GET', path: '/urls')

app.get("/urls", (req, res) => {
  const user = userDatabase[req.session.user_id];
  urls = getUserUrls([req.session.user_id], urlDatabase);
  console.log("User id: ", req.session.user_id);
  const templateVars = {
    user: user,
    urls: urls
  };
  res.render("urls_index", templateVars);
});

// Page with create new longURL form
//API (host: 'http://localhost:8080', method: 'GET', path: '/urls/new')

app.get("/urls/new", (req, res) => {
  const user = userDatabase[req.session.user_id];
  if (isUserLoggedin(req, res));
  const templateVars = {
    user: user,
  };
  res.render("urls_new", templateVars);
});

// Creating a new LongURL
// API (host: 'http://localhost:8080', method: 'POST', path: '/urls')

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: userDatabase[req.session.user_id]
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
    const userID = userDatabase[req.session.user_id];
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


app.listen(PORT, () => {
  console.log(`TinyApp server is listening on port ${PORT}!`);
});