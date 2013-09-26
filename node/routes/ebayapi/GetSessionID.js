var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');

module.exports = {
	
  call: function(request, callback) {
		
    async.waterfall([
      
      function(callback) {
        task.getnewtokenmap(request.email, callback);
      },
      
      function(token, callback) {
        
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
        
        task.addqueue(requestjson, callback);
      },
      
      function(resultjson, callback) {
        
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            
            collection.update(
              {
                email: request.email
              },
              {
                $set: {
                  sessionid: resultjson.SessionID
                }
              }
            );
            
            callback(null, resultjson.SessionID);
            
          });
        }); // mongo
        
      }
        
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call
	
}
