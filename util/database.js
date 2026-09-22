const mongodb = require('mongodb');
const mongoclient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    mongoclient.connect('REDACTED_MONGODB_URI')
        .then(client => {
            console.log("connected!");
            _db = client.db();
            callback();
        }).catch(err => {
        console.log(err);
    });
};

const getDb = () => {
    if (_db) return _db;
    throw 'No database found';
}


module.exports = {mongoConnect, getDb};