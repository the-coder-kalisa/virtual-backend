const mongoose = require('mongoose');
const url = "mongodb://localhost:27017/chating";
mongoose.connect(url, ()=>{
    console.log('connected');
})