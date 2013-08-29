var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var mongoclient = new MongoClient(new Server("10.156.17.98", 27017, {native_parser: true}));
//var mongoclient = new MongoClient(new Server("localhost", 27017, {native_parser: true}));

mongoclient.open(function(err, mongoclient) {
  
  var db = mongoclient.db("ebay-sandbox");
  
  db.collection('users').find().toArray(function(err, documents) {
    
    console.dir(documents);
    
    db.close();
  });
});

process.exit();

var mongodb = require("mongodb");
var mongoserver = new mongodb.Server('10.156.17.98', port, server_options);
var db_connector = new mongodb.Db(name, mongoserver, db_options);

db_connector.open(callback);

process.exit();

// Retrieve
var MongoClient = require('mongodb').MongoClient;

// Connect to the db
MongoClient.connect("mongodb://10.156.17.98:27017/ebay-sandbox", function(err, db) {
  console.log(err);
  if (!err) {
    console.log("We are connected");
  } else {
    console.log("ERROR");
  }
});

console.dir(MongoClient);

console.log('b');

process.exit();


fs = require('fs');
var xml = fs.readFileSync('/var/www/sandbox.listers.in/logs/apicall/GetSellerList/fd3s.boost@gmail.com.testuser_tokyo.2.xml');

var parseString = require('xml2js').parseString;

parseString(xml, function (err, result) {
  
  //console.dir(result.GetSellerListResponse.ItemArray);
  
  //console.dir(result.GetSellerListResponse.ItemArray[0]);
  //return;
  
  var items = result.GetSellerListResponse.ItemArray[0].Item
  for (i in items) {
    var item = items[i];
    console.log(item.ItemID + ' : ' + item.Title);
    console.dir(item);
    return;
  }
  
});

process.exit();

var http = require('http');

http.createServer(function (req, res) {
  
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
  
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
