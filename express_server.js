var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser')

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));



app.use(cookieParser())
app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render("urls_register", templateVars);

})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    username: req.cookies['username']
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies['username']
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies['username']
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // let longURL = urlDatabase[shortURL]
  // let longURL = "http://www.lighthouselabs.ca"
  let shortURL = req.params.shortURL
  let longURL = urlDatabase[shortURL]
  res.redirect(longURL);
  // res.redirect('/urls')
});

app.post("/register", (req, res) => {
  let newUser = req.body.regUser
  let newPass = req.body.regPass
  console.log(newUser)
  console.log(newPass)
  res.redirect("/urls")
})


app.post("/login", (req, res) => {
  userCookie = req.body.login
  if (userCookie) {
    res.cookie('username', userCookie, {
      expires: 0
    })
  }
  res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  // let templateVars = {
  //   username: req.cookies['username']
  // };
  res.clearCookie('username')
  res.redirect("/urls")
})

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL
  if (shortURL) {
    delete urlDatabase[shortURL]
  }
  res.redirect("/urls/")
})

app.post("/urls/:shortURL/edit", (req, res) => {
  let shortURL = req.params.shortURL
  urlDatabase[shortURL] = req.body.editURL
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
