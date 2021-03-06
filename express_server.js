// Required dependencies and settings
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const cookieSession = require('cookie-session')
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours before session expires
}))
app.set("view engine", "ejs");


// Database of users and URLs
const users = {};

const urlDatabase = {};

// Random string generator for URLs and IDs
function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

// Handles filtering of URLs based on User IDs
function urlsForUser(id) {
  let userURLS = {};
  for (link in urlDatabase) {
    if (urlDatabase[link].userID == id) {
      userURLS[link] = urlDatabase[link]
    }
  }
  return userURLS;
}

app.get("/", (req, res) => {
  if (req.session.user_id) { // If user is logged in redirects to main URL page, otherwise redirects to login
    res.redirect("/urls")
    return;
  }
  res.redirect("/login")
});

// Handles registration page requests
app.get("/register", (req, res) => {
  if (!req.session.user_id) { // If user is already logged in redirects to main URL page, otherwise proceed to the registration page
    let templateVars = {
      urls: urlDatabase,
      users: users[req.session.user_id]
    };
    res.render("urls_register", templateVars);
    return
  } else {
    res.redirect("/urls")
  }

})

// Handles login page requests
app.get("/login", (req, res) => {
  let templateVars = { // If user is already logged in redirects to main URL page, otherwise proceed to the login page
    urls: urlDatabase,
    users: users[req.session.user_id]
  };
  if (!req.session.user_id) {
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls")
  }
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    users: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

// If the url tries to create a new shortened link without being logged in, it redirects them to the login page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    users: users[req.session.user_id]
  }
  if (!req.session.user_id) {
    res.redirect("/login")
  } else {
    res.render("urls_new", templateVars);
  }
});

// Handles requests for edit URL page, and returns an error for different scenarios
app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) { // Return error if the user inputs an invalid id
    let errRes = {
      errHead: "404 - Page Not Found",
      errBody: "This URL does not exist"
    }
    res.render("error", errRes)
    return
  }
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    users: users[req.session.user_id]
  };
  if (!req.session.user_id) { // Return error if the user is not logged in
    let errRes = {
      errHead: "401 - Unauthorized",
      errBody: "Please login to edit links"
    }
    res.render("error", errRes)
    return
  }
  if (req.session.user_id == urlDatabase[req.params.id].userID) {
    res.render("urls_show", templateVars);
  } else {
    let errRes = { // Return error if the user is attempting to edit a URL that belongs to another user
      errHead: "403 - Forbidden",
      errBody: "Cannot edit a link that belongs to another user"
    }
    res.render("error", errRes)
    return
  }
});

// Redirects user to the full URL destination, and gives error if given an invalid shortened URL
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  for (link in urlDatabase) {
    if (shortURL == link) {
      let longURL = urlDatabase[shortURL].longURL
      res.redirect(longURL);
      return
    }
  }
  let errRes = {
    errHead: "404 - Page Not Found",
    errBody: "This URL does not exist"
  }
  res.render("error", errRes)
});

app.get("/:invalid", (req, res) => {
  let errRes = {
    errHead: "404 - Page Not Found",
    errBody: "This URL does not exist"
  }
  res.render("error", errRes)
});

// Handles registration requests and provides error messages for various scenarios
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) { // Returns error if missing fields
    let errRes = {
      errHead: "400 - Bad Request",
      errBody: "All fields required"
    }
    res.render("error", errRes)
    return
  }
  let newUser = req.body.email
  let newPass = bcrypt.hashSync(req.body.password, 10)
  for (list in users) {
    objectEmail = users[list].email
    if (newUser == objectEmail) { // Returns error if email is already registered
      let errRes = {
        errHead: "400 - Bad Request",
        errBody: "Email already in use"
      }
      res.render("error", errRes)
      return
    }
  }
  randUserID = generateRandomString()
  users[randUserID] = {
    id: randUserID,
    email: newUser,
    password: newPass
  }
  req.session.user_id = randUserID
  res.redirect("/urls")
})

// Handles login requests and provides error messages for various scenarios
app.post("/login", (req, res) => {
  userCookie = req.body.login
  inputPassword = req.body.password
  if (userCookie) {
    for (name in users) {
      if (userCookie == users[name].email) {
        if (bcrypt.compareSync(inputPassword, users[name].password)) {
          cookieID = users[name].id
          req.session.user_id = cookieID
          res.redirect("/urls")
          return
        } else {
          let errRes = { // Returns an error if password is incorrect
            errHead: "401 - Unauthorized",
            errBody: "Please verify your password"
          }
          res.render("error", errRes)
          return
        }
      }
    }
    let errRes = { // Returns an error if a non-registered email is entered
      errHead: "401 - Unauthorized",
      errBody: "Please verify your login email address"
    }
    res.render("error", errRes)
    return
  }
  let errRes = { // Returns an error if email field is left empty
    errHead: "400 - Bad Request",
    errBody: "Email cannot be left empty"
  }
  res.render("error", errRes)
  return
})

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/urls")
})

// Handles requests to delete shortened links and provides error messages for various scenarios
app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  if (!req.session.user_id) { // Returns an error if not logged in
    let errRes = {
      errHead: "401 - Unauthorized",
      errBody: "Please login to delete links"
    }
    res.render("error", errRes)
    return
  } else if (req.session.user_id !== urlDatabase[shortURL].userID) { // Returns an error if attempting to delete another user's link
    let errRes = {
      errHead: "403 - Forbidden",
      errBody: "Cannot delete a link that belongs to another user"
    }
    res.render("error", errRes)
    return
  }
  if (shortURL && req.session.user_id == urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL]
  }
  res.redirect("/urls/")
})

// Handles requests to edit shortened links and provides error messages for various scenarios
app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  if (!req.session.user_id) { // Returns an error if not logged in
    let errRes = {
      errHead: "401 - Unauthorized",
      errBody: "Please login to delete links"
    }
    res.render("error", errRes)
    return
  } else if (req.session.user_id !== urlDatabase[shortURL].userID) { // Returns an error if attempting to edit another user's link
    let errRes = {
      errHead: "403 - Forbidden",
      errBody: "Cannot edit a link that belongs to another user"
    }
    res.render("error", errRes)
    return
  }
  if (req.session.user_id == urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.editURL
  }
  res.redirect("/urls/")
})

// hHndles requests to create new shortened links and returns an error if not logged in
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    let errRes = {
      errHead: "401 - Unauthorized",
      errBody: "Please login to use TinyApp!"
    }
    res.render("error", errRes)
    return
  }
  let randomShortURL = generateRandomString()
  urlDatabase[randomShortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  res.redirect(`/urls/${randomShortURL}`)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
