var mongo = require('../mongoconnect');
var taskmodule = require('./task');
var config = require('../../config');

module.exports = {
	
  call: function(request, callback) {
		
    taskmodule.getnewtokenmap(request.email, function(token) {
      
      var requestjson = {
        email: request.email,
        callname: 'GetSessionID',
        site: 'US',
        siteid: 0,
        params: {
          RequesterCredentials: {
            eBayAuthToken: config.admintoken
          },
          WarningLevel: 'High',
          RuName: config.runame,
          MessageID: token
        }
      };
      
      taskmodule.addqueue(requestjson, function(resultjson) {
        
        var sessionid = resultjson.SessionID;
        
        taskmodule.getemailfromtokenmap(resultjson.CorrelationID, function(email) {
          
          mongo(function(db) {
            db.collection('users', function(err, collection) {
              
              collection.update(
                {email: email},
                {$set: {sessionid: sessionid}},
                function(err, result) {
			            callback(sessionid);
                }
              );
              
            });
          }); // mongo
          
        }); // getemailfromtokenmap
        
		  }); // addqueue
      
    }); // getnewtokenmap
    
  } // call
	
}
