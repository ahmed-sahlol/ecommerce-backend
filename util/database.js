const mongodb = require('mongodb');
const mongoclient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    mongoclient.connect(process.env.MONGODB_URI).then(client => {
        console.log("connected!");
        _db = client.db();
        callback();
    }).catch(err => {
        console.error("Database connection failed:", err.message);
    });
};

const getDb = () => {
    if (_db) return _db;
    throw new Error('No database found');
};

module.exports = {mongoConnect, getDb};