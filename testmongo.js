const { MongoClient } = require("mongodb");
require("dotenv").config();

const PORT = process.env.PORT;
const DATABASE_URI = process.env.DATABASE_URI;

const express = require("express");
const app = express();
app.listen(PORT);
console.log("Server started at http://localhost:" + PORT);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes will go here

// Default route:
app.get("/", function (req, res) {
  const myquery = req.query;
  var outstring = "Starting... ";
  res.send(outstring);
});

app.get("/say/:name", function (req, res) {
  res.send("Hello " + req.params.name + "!");
});

String.prototype.toTitleCase = function () {
  return this.match(
    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
  )
    .map((x) => x.slice(0, 1).toUpperCase() + x.slice(1))
    .join(" ");
};

// Route to access database:
app.get("/api/mongo/:item", function (req, res) {
  const client = new MongoClient(DATABASE_URI);
  const searchKey = "{ name: '" + req.params.item + "' }";
  console.log("Looking for: " + searchKey);

  async function run() {
    try {
      const database = client.db("CMPS415");
      const parts = database.collection("Equipment");

      // But we will use the parameter provided with the route
      const query = {
        name: req.params.item.toTitleCase(),
      };

      const part = await parts.findOne(query);
      console.log(part);
      res.send("Found this: " + JSON.stringify(part)); //Use stringify to print a json
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
});
