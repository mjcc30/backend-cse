const http = require("http");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongo = require("mongodb").MongoClient;

const app = express();
app.use(cors());
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
let dbName = "myDatabase";
const user = "maxime";
const password = "MIALy4PiTZpvMa1I";
const url = `mongodb+srv://${user}:${password}@ce-news.knrp2.mongodb.net/${dbName}?retryWrites=true&w=majority`;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html");
  res.end('<a href="https://backend-ce-news.herokuapp.com/data">see data</a>');
});

mongo.connect(
  url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    console.log(`Connecter à ${dbName}!`);
  }
);

app.get("/data", function (req, res, next) {
  mongo.connect(url, function (err, database) {
    const db = database.db("myDatabase");
    const collection = db.collection("users");
    collection.find({}).toArray((x, result) => {
      res.send(result);
    });
  });
});

server.listen(port, () => {
  console.log(`Server running at port ` + port);
});
