const express = require('express')
const app = express()
const port = 3000
const config = require("dotenv").config();
const mongoose = require('mongoose');
const db = mongoose.connection;
const cors = require("cors")
const {checkAuthenticationHeaders, checkSocketAuthentication} = require("./middleware/auth");
const bodyParser = require('body-parser')
const cookieParser = require("cookie-parser");
const http = require('http').createServer(app);
const path = require("path");
const io = require('socket.io')(http);

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false, limit:'50mb' }));

app.use(cors())
app.use(cookieParser());
app.use(checkAuthenticationHeaders)

app.get('/api/status', (req, res) => {
    res.json({status:"ok"})
})

const {documentsRouter, documentsSocketController} = require("./routes/documents")

app.use("/api/documents", documentsRouter);
app.use("/api/users", require("./routes/users").router);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client/index.html'));
});

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    http.listen(port, () => {
        console.log("Aphasense up and running")
    })
});
mongoose.connect(process.env.MONGODB_STRING, {useNewUrlParser: true, useUnifiedTopology: true});



io.use(checkSocketAuthentication);

io.on('connection', (socket) => {
    socket.on("editDocument", (data)=>{
        //TODO: move to middleware
        try{
            data = JSON.parse(data)
        }catch(e){

        }
        documentsSocketController.editDocument({socket,data,io})
    });
    socket.on("viewDocument", (data)=>{
        //TODO: move to middleware
        try{
            data = JSON.parse(data)
        }catch(e){

        }
        documentsSocketController.viewDocument({socket,data,io})
    })
});