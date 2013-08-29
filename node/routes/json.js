var mongo = require('../routes/mongoconnect');
var net = require('net');
var config = require('../config');

exports.addaccount = function(req, res) {
	
  if (!req.isAuthenticated()) res.json(null);
  
  var apimodule = require('./ebayapi/GetSessionID');
	
	var reqjson = {email: req.user.email};
	
  apimodule.call(reqjson, function(response) {
    
		res.json({
			json: {url: config.signinurl + '?SignIn&runame=' + config.runame + '&SessID=' + response}
		});
		
  });
	
}

exports.removeaccount = function(req, res) {
	
  if (!req.isAuthenticated()) res.json(null);
	
	var userid = req.body.userid;
  
  mongo(function(db) {
    
    db.collection('items.' + req.user._id, function(err, collection) {
      collection.remove({UserID: userid});
    });
    
    db.collection('users', function(err, collection) {
      
      collection.update(
        {email: req.user.email},
        {$pull: {userids2: {username: userid}}},
        function(err, res) {
          console.dir(err);
          console.dir(res);
        }
      );
      
    });
    
    res.end();
  });
	
}

exports.import = function(req, res) {
  
  if (!req.isAuthenticated()) res.json(null);
  
  var apimodule = require('./ebayapi/GetSellerList');
  
	var reqjson = {
    email:     'fd3s.boost@gmail.com',
    userid:    'testuser_hal',
    daterange: 'End',
    datestart: '2013-05-04',
    dateend:   '2013-08-01'
  };
  
  apimodule.call(reqjson, function(response) {
    res.end();
  });
  
}
