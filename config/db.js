const mongoose = require('mongoose');

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB OK!');
    } catch (error) {
        console.error('DB error: ', error);
    }
}

module.exports = connectDB;