const http = require("http");
const express = require("express");
const cors = require("cors");
const socketio = require("socket.io");
const bodyParser = require("body-parser");

var mongojs = require("mongojs");
const mongo = require("mongodb").MongoClient;

const app = express();
const server = http.createServer(app);
const websocket = socketio(server);

const hostname = "localhost";
const port = process.env.PORT || 3001;
let dbName = "myDatabase";
const user = "maxime";
const password = "MIALy4PiTZpvMa1I";
const url = `mongodb+srv://${user}:${password}@ce-news.knrp2.mongodb.net/${dbName}?retryWrites=true&w=majority`;
app.use(cors());
app.use(bodyParser.json());

/** DEBUT chat */

let ObjectID = mongojs.ObjectID;
const db2 = mongojs(url);
// Mapping objects to easily map sockets and users.
const clients = {};
const users = {};
// ceci représente une unique chatroom.
// pour cette exemple, il n'y a qu'une seul chatroom;
var chatId = 1;
websocket.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");
  clients[socket.id] = socket;
  socket.on("userJoined", (userId) => onUserJoined(userId, socket));
  socket.on("message", (message) => {
    onMessageReceived(message, socket);
  });
});
// Event listeners.
// Quand un uttilisateur rejoint le chat.
function onUserJoined(userId, socket) {
  try {
    // le userId est null pour les nouveaux utilisateurs.
    if (!userId) {
      var user = db2.collection("users").insert({}, (err, user) => {
        socket.emit("userJoined", user._id);
        users[socket.id] = user._id;
        _sendExistingMessages(socket);
      });
    } else {
      users[socket.id] = userId;
      _sendExistingMessages(socket);
    }
  } catch (err) {
    console.err(err);
  }
}
// Quand un uttilisateur envoie un message.
function onMessageReceived(message, senderSocket) {
  const userId = users[senderSocket.id];
  _sendAndSaveMessage(message[0], senderSocket);
}
// envoie les messages existant à l'utilisateur qui vient de se connecter.
function _sendExistingMessages(socket) {
  const messages = db2
    .collection("messages")
    .find({ chatId })
    .sort({ createdAt: 1 })
    .toArray((err, messages) => {
      // si messages est vide, return.
      if (!messages.length) return;
      socket.emit("message", messages.reverse());
    });
  messages;
}
// envoie le message à la base de données et envoie tout.
function _sendAndSaveMessage(message, socket, fromServer) {
  var messageData = {
    text: message.text,
    user: message.user,
    createdAt: new Date(message.createdAt),
    chatId: chatId,
  };
  db2.collection("messages").insert(messageData, (err, message) => {
    // si le message viens du serveur, envoyer à tout le monde.
    var emitter = fromServer ? websocket : socket.broadcast;
    emitter.emit("message", [message]);
  });
}
/**FIN */

mongo.connect(
  url,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    console.log("Connecter à myDatabase!");
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

app.post("/data", function (req, res, next) {
  mongo.connect(url, function (err, database) {
    const db = database.db("myDatabase");
    const collection = db.collection("users");
    let something = {
      _id: req.body._id,
      email: req.body.email,
      password: req.body.password,
    };
    collection.insertOne(something, (x, result) => {
      res.send(result);
    });
  });
});

app.delete("/data", function (req, res, next) {
  mongo.connect(url, function (err, database) {
    const db = database.db("myDatabase");
    const collection = db.collection("users");
    let something = {
      _id: req.body._id,
    };
    collection.deleteOne(something, (x, result) => {
      res.send(result);
    });
  });
});

app.put("/data", function (req, res, next) {
  mongo.connect(url, function (err, database) {
    const db = database.db("myDatabase");
    const collection = db.collection("users");
    let something = {
      _id: req.body._id,
    };
    collection.findOneAndUpdate(
      something,
      {
        $set: {
          email: req.body.email,
          password: req.body.password,
        },
      },
      (x, result) => {
        res.send(result);
      }
    );
  });
});

server.listen(port, () => {
  console.log(`Server running at ${port}`);
});
