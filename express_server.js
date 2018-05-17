var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
// var cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session')

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));

const bcrypt = require('bcrypt');
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
  }
}

// const password = "purple-monkey-dinosaur"; // you will probably this from req.params
// const hashedPassword = bcrypt.hashSync(password, 10);

// app.use(cookieParser())
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
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
  // res.end("Hello!");
  if (req.session.user_id){
    res.redirect("/urls")
    return
  }
  res.redirect("/urls/login")
});

app.get("/urls/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    users: users[req.session.user_id]
  };
  res.render("urls_register", templateVars);

})

app.get("/urls/login", (req, res) => {
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

// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });

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
    // res.render("urls_index", templateVars);
    res.redirect("/urls/login")
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  // console.log(urlDatabase[req.params.id].userID) // giving undefined
  // console.log(users)
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send('this url does not exist')
    return
  }
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    users: users[req.session.user_id]
  };
  //console.log(req.params.id) // giving 9sm5xK 
  if (!req.session.user_id) {
    res.status(400).send('please login to edit links')
    return
  }
  if (req.session.user_id == urlDatabase[req.params.id].userID) {
    //console.log(req.params.id)
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send('cannot access url not belonging to user')
  }
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  let longURL = urlDatabase[shortURL].longURL
  res.redirect(longURL);
});

app.get("/400", (req, res) => {
  res.render("400")
})

app.post("/register", (req, res) => {
  // console.log(users)
  let newUser = req.body.email
  let newPass = bcrypt.hashSync(req.body.password, 10)
  for (list in users) {
    objectEmail = users[list].email
    // console.log(newUser, objectEmail, '&', users[list].email)
    if (newUser == objectEmail) {
      // console.log('new email already existing')
      // res.redirect("400")
      res.status(400).send('email already exists')
      return
    }
  }
  if (!newUser || !newPass) {
    // console.log('missing parameter')
    // res.redirect("400")
    res.status(400).send('missing parameter')
    return
  } else {
    randUserID = generateRandomString()
    users[randUserID] = {
      id: randUserID,
      email: newUser,
      password: newPass
    }
    // res.cookie('user_id', randUserID, {
    //   expires: 0
    // })
    req.session.user_id = randUserID
    // console.log('success adding user')
    // console.log(users)
    res.redirect("/urls")
  }
})


app.post("/login", (req, res) => {
  userCookie = req.body.login
  inputPassword = req.body.password
  if (userCookie) {
    for (name in users) {
      if (userCookie == users[name].email) {
        // if (inputPassword == users[name].password) {
        if (bcrypt.compareSync(inputPassword, users[name].password)) {
          cookieID = users[name].id
          // console.log(cookieID)
          // console.log(users[name].id)
          // res.cookie('user_id', cookieID, {
          //   expires: 0
          // })
          req.session.user_id = cookieID
          res.redirect("/urls")
          return
        } else {
          res.status(400).send('Wrong password')
          // console.log(inputPassword)
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
  req.session.user_id = null
  res.redirect("/urls")
})

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  if (shortURL && req.session.user_id == urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL]
  }
  res.redirect("/urls/")
})

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  if ( /*shortURL && */ req.session.user_id == urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.editURL
  }
  res.redirect("/urls/")
})

app.post("/urls", (req, res) => {
  // console.log(req.body); // debug statement to see POST parameters
  // res.send("Ok"); // Respond with 'Ok' (we will replace this)
  let randomShortURL = generateRandomString()
  urlDatabase[randomShortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  // console.log(urlDatabase)
  // res.redirect("/urls/" + randomShortURL)
  res.redirect("/urls")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
