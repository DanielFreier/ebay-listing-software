var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var connectionInstance;

module.exports = function(callback) {
  
  if (connectionInstance) {
    callback(connectionInstance);
    return;
  }
  
  var db = new Db('ebay', 
                  new Server("10.156.17.98", Connection.DEFAULT_PORT, {auto_reconnect: true}));
  db.open(function(error, databaseConnection) {
    if (error) throw new Error(error);
    connectionInstance = databaseConnection;
    callback(databaseConnection);
  });
};
