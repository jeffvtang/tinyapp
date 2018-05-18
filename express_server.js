const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const cookieSession = require('cookie-session')
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.set("view engine", "ejs");

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("test", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("test", 10)
  },
  "workingID": {
    id: "workingID",
    email: "test@test.com",
    password: bcrypt.hashSync("test", 10)
  },
  'nqPn0E': {
    id: 'nqPn0E',
    email: 'user@lighthouselabs.com',
    password: '$2b$10$DYSk7Uj.p5d3AGvgtwI1u.xWktVOFSr6ccFPk1xSAgW4YdxSN4M8O'
  }
}

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "workingID"
  },
  "b2xVn4": {
    longURL: "http://www.amazon.ca",
    userID: "workingID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

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
  if (req.session.user_id) {
    res.redirect("/urls")
    return;
  }
  res.redirect("/login")
});

app.get("/register", (req, res) => {
  if (!req.session.user_id) {
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

app.get("/login", (req, res) => {
  let templateVars = {
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

app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
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
  if (!req.session.user_id) {
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
    let errRes = {
      errHead: "403 - Forbidden",
      errBody: "Cannot edit a link that belongs to another user"
    }
    res.render("error", errRes)
    return
  }
});

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

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
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
    if (newUser == objectEmail) {
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
          let errRes = {
            errHead: "401 - Unauthorized",
            errBody: "Please verify your password"
          }
          res.render("error", errRes)
          return
        }
      }
    }
    let errRes = {
      errHead: "401 - Unauthorized",
      errBody: "Please verify your login email address"
    }
    res.render("error", errRes)
    return
  }
  let errRes = {
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

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  if (!req.session.user_id) {
    let errRes = {
      errHead: "401 - Unauthorized",
      errBody: "Please login to delete links"
    }
    res.render("error", errRes)
    return
  } else if (req.session.user_id !== urlDatabase[shortURL].userID) {
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

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  if (!req.session.user_id) {
    let errRes = {
      errHead: "401 - Unauthorized",
      errBody: "Please login to delete links"
    }
    res.render("error", errRes)
    return
  } else if (req.session.user_id !== urlDatabase[shortURL].userID) {
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
