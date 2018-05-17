var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser')

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "test"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "test"
  },
  "workingID": {
    id: "workingID",
    email: "test@test.com",
    password: "test"
  }
}


app.use(cookieParser())
app.set("view engine", "ejs");

// //url has object for each user, and then connects urls
// var urlDatabase = {
//   "workingID": {
//     shortURL:

//   }
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

//url has each short link as an ID and the longURL and userID as links in it
var urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "workingID"
  },
  "b2xVn4": {
    longURL: "http://www.lighthouselabs.ca2",
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

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function urlsForUser(id) {
  let userURLS = {}
  for (link in urlDatabase) {
    if (urlDatabase[link].userID == id) {
      userURLS[link] = urlDatabase[link]
    }
  }
  return userURLS
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    users: users[req.cookies['user_id']]
  };
  res.render("urls_register", templateVars);

})

app.get("/urls/login", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    users: users[req.cookies['user_id']]
  };
  if (!req.cookies['user_id']) {
    res.render("urls_login", templateVars);
  } else {
    res.redirect("/urls")
  }
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.cookies['user_id']),
    users: users[req.cookies['user_id']]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    users: users[req.cookies['user_id']]
  }
  if (!req.cookies['user_id']) {
    // res.render("urls_index", templateVars);
    res.redirect("/urls")
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    users: users[req.cookies['user_id']]
  };
  // console.log(req.params.id)
  res.render("urls_show", templateVars);
  
  // if (req.cookies['user_id'] == users[templateVars.shortURL].userID) {
  //   console.log(req.params.id)
  //   res.render("urls_show", templateVars);
  // } else {
  //   res.status(400).send('cannot access url')
  // }
});

app.get("/u/:shortURL", (req, res) => {
  // let longURL = urlDatabase[shortURL]
  // let longURL = "http://www.lighthouselabs.ca"
  let shortURL = req.params.shortURL
  let longURL = urlDatabase[shortURL]
  res.redirect(longURL);
  // res.redirect('/urls')
});

app.get("/400", (req, res) => {
  res.render("400")
})

app.post("/register", (req, res) => {
  console.log(users)
  let newUser = req.body.email
  let newPass = req.body.password
  for (list in users) {
    objectEmail = users[list].email
    if (newUser == objectEmail) {
      console.log('new email already existing')
      res.redirect("400")
    }
  }
  if (!newUser || !newPass) {
    console.log('missing parameter')
    res.redirect("400")
  } else {
    randUserID = generateRandomString()
    users[randUserID] = {
      id: randUserID,
      email: newUser,
      password: newPass
    }
    res.cookie('user_id', randUserID, {
      expires: 0
    })
    console.log('success adding user')
    res.redirect("/urls")
  }
})


app.post("/login", (req, res) => {
  userCookie = req.body.login
  inputPassword = req.body.password
  // console.log(userCookie)
  if (userCookie) {
    for (name in users) {
      if (userCookie == users[name].email) {
        // console.log(inputPassword, users[name].password, inputPassword == users[name].password)
        if (inputPassword == users[name].password) {
          cookieID = users[name].id
          res.cookie('user_id', cookieID, {
            expires: 0
          })
          res.redirect("/urls")
          return
        } else {
          // console.log('password fail')
          res.status(400).send('Wrong password')
          return
        }
      }
    }
    res.status(400).send('email does not exist')
    return
  }
  res.status(400).send('no email entered')
})

app.post("/logout", (req, res) => {
  // let templateVars = {
  //   username: req.cookies['username']
  // };
  res.clearCookie("user_id")
  res.redirect("/urls")
})

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  if (shortURL && req.cookies['user_id'] == urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL]
  }
  res.redirect("/urls/")
})

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL
  if ( /*shortURL && */ req.cookies['user_id'] == urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.editURL
  }
  res.redirect("/urls/")
})

app.post("/urls", (req, res) => {
  console.log(req.body); // debug statement to see POST parameters
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
  let randomShortURL = generateRandomString()
  urlDatabase[randomShortURL] = req.body.longURL
  // res.redirect("/urls/" + randomShortURL)
  res.redirect("/urls")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
