const router = require('express').Router();
const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/chating";
router.post('/signup', async(req, res, next)=>{
    try {
        const {name, email, password, url} = req.body;
        if(name === "") return res.json({msg: 'name can\'t be blank', status: "blocked"});
        if(!email.includes('@gmail.com') || email.charAt(0) === '@') return res.json({msg: 'invalid email', status: 'blocked'});
        if(password === "") return res.json({msg: 'password can\'t be blank', status: "blocked"});
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({name, email, password: hashed, picture: url});
        res.json({user, status: 'allowed'});
    } catch (error) {
        if(error.code === 11000){
            return res.json({msg: 'email already exists', status: 'blocked'});
        }
        else{
            console.log(error)
        }
    }
})
router.post('/login', async(req, res, next)=>{
    try {
        MongoClient.connect(url, async(err, db)=>{
        const {email, password} = req.body;
        if(email === "") return res.json({msg: 'email can\'t be blank', status:'blocked'});
        if(!email.includes('@gmail.com')) return res.json({msg: 'invalid email', status: 'blocked'});
        var user = await User.findOne({email});
        if(!user) return res.json({msg: 'user not found', status: 'blocked'})
        const prev = {email};
        const newValues = {$set: {status: 'online'}};
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.json({msg: 'incorrect password', status: 'blocked'})
        const col = db.db("chating").collection("users");
        col.updateOne(prev, newValues);
        col.find({email}, {projection: {password: 0, email: 0}}).toArray((err, user)=>{
            res.status(200).json({user, status: 'allowed'});
        })
        })
    } catch (error) {
        console.log(error);
    }
})
module.exports = router;