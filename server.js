const express = require('express');
const app = express();
const rooms = ['general', 'tech', 'finance', 'crypto'];
const cors =require('cors');
const thecoder = require('./routes/UserRoutes');
const Message = require('./models/Message');
const User = require('./models/User');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const url = 'mongodb://localhost:27017/chating'
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
require('./connection.js');
app.use('/users', thecoder)
const server = require('http').createServer(app);
const port = 5000;
const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:3000',
        method: ['GET' , 'POST']
    }
})
app.get('/rooms', (req, res, next)=>{
    res.json(rooms);
})
const getLastMessagesFromRoom = async(room) =>{
let roomMessages = await Message.aggregate([
    {$match: {to: room}},
    {$group: {_id: '$date', messagesByDate: {$push: '$$ROOT'}}}
])
return roomMessages;
}
const sortRoomMessagesByDate = (messages) =>{
    return messages.sort((a, b)=>{
        let date1 = a._id.split('/');
        let date2 = b._id.split('/');
        date1 = date1[2] + date1[1] + date1[0];
        date2 = date2[2] + date2[1] + date2[0];
        return date1 < date2 ? -1 : 1;
    })
}
io.on('connection', (socket)=>{
    socket.on('new-user', async()=>{
        try{
            MongoClient.connect(url, (err, db)=>{
                if(err) throw err;
                const col = db.db('chating').collection('users');
                col.find({}, {projection: {password: 0, email: 0, newMessage: 0}}).toArray((err, members)=>{
                    if(err) throw err;
                    io.emit('new-user', members)
                });
            })
        }catch(error){
            console.log(error)
        }
    })
    socket.on('join-room', async(room)=>{
        socket.join(room);
        let roomMessages = await getLastMessagesFromRoom(room);
        roomMessages = sortRoomMessagesByDate(roomMessages);
        socket.emit('room-messages', roomMessages);
    });
    socket.on('message-room', async(room, content, sender, time, date)=>{
        const newMessage = await Message.create({content, from: sender, time, date, to: room});
        let roomMessages = await getLastMessagesFromRoom(room);
        roomMessages = sortRoomMessagesByDate(roomMessages);
        io.to(room).emit('room-messages', roomMessages);
        io.emit('notification', room);
    });
    app.post('/logout', async(req, res, next)=>{
    try{
        MongoClient.connect(url, async(err, db)=>{
            if(err) return console.log(err);
            const {_id, newMessage} = req.body;
            const col = db.db('chating').collection('users');
            const myquery = { _id: mongo.ObjectId(_id) };
            const newValues = {$set: {status: 'offline', newMessage}}
            col.updateOne(myquery, newValues);
            col.find({}, {projection: {password: 0, email: 0, newMessage: 0}}).toArray((err, members)=>{
                if(err) throw err;
                socket.broadcast.emit('new-user', members);
                res.status(200).send();
            })
            })
        } catch(e){
            console.log(e)
        }
    })
})
server.listen(port, ()=>{console.log(`server is running http://localhost:${port}`);})