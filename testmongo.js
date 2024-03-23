const { MongoClient } = require("mongodb");
var express = require("express");
var cookieParser = require("cookie-parser"); //needed for cookies
var bodyParser = require("body-parser");
require("dotenv").config();

//T1-REF1
const DATABASE_URI = process.env.DATABASE_URI;
const PORT = process.env.PORT;

const app = express();

app.use(cookieParser()); //needed for cookies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT);
console.log("Server started at http://localhost:" + PORT);

var jsonParser = bodyParser.json();

//T4-REF1
const viewCookiesLink = `<p><a href="/report">View Cookies</a>`;
const clearCookiesLink = `<p><a href="/clearcookies">Clear Cookies</a>`;
const goHomeLink = `<p><a href="/">Go Home</a>`;

const home = `
<html>
  <body>
    <h1>Welcome</h1>
    <span> No cookie detected. Please select from the options below: </span>
    <p>
    <button type="button" id="button" onclick="location.href = 'login';"/>Login</button>
    <button type="button" id="button" onclick="location.href = 'register';"/>Register</button>
  </body>
  ${viewCookiesLink}
</html>
`;

var login = `
<html>
  <head>
    <style> 
      body {
        margin-left: 10px;
      } 
      p {
        display: flex;
      } 
      label {
        display: flex;
        justify-content: flex-end;
        width: 75px;
        margin-right: 5px;
      }
    </style> 
  </head>
  <body>
    <h1>Login</h1>
    <form action="./login_result" method="POST">
      <p> <label for="user">User_ID: </label><input type="text" name="user" required>
      <p><label for="password">Password: </label><input type="text" name="password" required>
      <p> <button type="submit" id="submit"/>Submit</button>
    </form>
    ${goHomeLink}
    ${viewCookiesLink}
  </body>
</html>`;

var register = `
<html>
  <head>
    <style> 
      body {
        margin-left: 10px;
      } 
      p {
        display: flex;
      } 
      label {
        display: flex;
        justify-content: flex-end;
        width: 75px;
        margin-right: 5px;
      }
    </style> 
  </head>
  <body>
    <h1>Register</h1>
    <form action="./register_result" method="POST">
      <p> <label for="user">User_ID: </label><input type="text" name="user" required>
      <p><label for="password">Password: </label><input type="text" name="password" required>
      <p> <button type="submit" id="submit"/>Submit</button>
    </form>
    ${goHomeLink}
    ${viewCookiesLink}
  </body>
</html>`;

// Default route:
app.get("/", function (req, res) {
  currentCookies = req.cookies;

  //If an authentication cookie exists, a message should be generated confirming that the cookie exists, and prints its value
  if (Object.keys(currentCookies).length > 0) {
    res.send(`Cookies: ${JSON.stringify(currentCookies)} ${clearCookiesLink}`);
  }

  // register or login
  res.send(home);
});

app.get("/say/:name", function (req, res) {
  res.send("Hello " + req.params.name + "!");
});

app.get("/login", function (req, res) {
  res.send(login);
});

app.post("/login_result", jsonParser, function (req, res) {
  const client = new MongoClient(DATABASE_URI);

  async function run() {
    try {
      const database = client.db("CMPS415");
      const users = database.collection("Users");

      const user_ID = req.body.user;
      const password = req.body.password;

      const query = {
        user_ID: user_ID,
        password: password,
      };

      const user = await users.findOne(query);

      //T3.1-REF1
      if (user === null) {
        res.send(
          `<p>Login Unsuccessful <p><a href="/login">Go Back</a> ${goHomeLink} ${viewCookiesLink}`
        );
      }

      //T3.2-REF1
      res.cookie("user_ID", "password", { maxAge: 20000 });
      res.send(`<p>Login Successful  ${goHomeLink} ${viewCookiesLink}`);
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
});

app.get("/register", function (req, res) {
  res.send(register);
});

//T2-REF1
app.post("/register_result", jsonParser, function (req, res) {
  const client = new MongoClient(DATABASE_URI);

  const doc2insert = {
    user_ID: req.body.user,
    password: req.body.password,
  };

  async function run() {
    try {
      const database = client.db("CMPS415");
      const collection = database.collection("Users");

      const response = await collection.insertOne(doc2insert);
      const statusMessage = `Registration ${
        response["acknowledged"] ? "Successful!" : "Unsuccessful."
      }`;

      res.send(
        `<p>${statusMessage} <p>Database Response: ` +
          JSON.stringify(response) +
          goHomeLink +
          viewCookiesLink
      );
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
});

String.prototype.toTitleCase = function () {
  return this.match(
    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
  )
    .map((x) => x.slice(0, 1).toUpperCase() + x.slice(1))
    .join(" ");
};

// Route to get info from database:
app.get("/api/mongo/:item", function (req, res) {
  const client = new MongoClient(DATABASE_URI);

  async function run() {
    try {
      const database = client.db("CMPS415");
      const collection = database.collection("Equipment");

      const query = {
        name: req.params.item.toTitleCase(),
      };

      const part = await collection.findOne(query);
      res.send("Found this: " + JSON.stringify(part)); //Use stringify to print a json
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
});

//T5-REF1
app.get("/clearcookies", function (req, res) {
  let output = "";
  currentCookies = req.cookies;

  Object.keys(currentCookies).forEach((cookie) => {
    output = output + `<p>Cookie deleted: ${cookie}`;
    res.clearCookie(cookie);
  });

  if (output === "")
    output = "<p>No cookies found." + viewCookiesLink + goHomeLink;

  res.send(output + viewCookiesLink + goHomeLink);
});

//T4-REF2
// Report cookies on console and browser
app.get("/report", function (req, res) {
  res.send(
    `${JSON.stringify(
      req.cookies
    )} --Done reporting  ${goHomeLink} ${clearCookiesLink}`
  );
});
