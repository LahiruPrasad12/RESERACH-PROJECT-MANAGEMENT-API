const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require("cors")

// dotenv.config({ path: './config.env' });



const app = require('./app');
const allowedOrigins = ['https://research-project-management-ui.vercel.app', 'https://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Enable passing cookies and other credentials
};

app.use(cors(corsOptions));
const port = 5000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

const URL = 'mongodb+srv://ecoprints:456abc@cluster0.inyuslv.mongodb.net/ecoprints?retryWrites=true&w=majority';

mongoose
  .connect(URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful!'));

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    console.log(userData)
    socket.join(userData._id);
    socket.emit("connected");
  });



  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));


  socket.on("new message", (newMessageRecieved) => {
    const chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    // socket.leave(userData._id);
  });
});