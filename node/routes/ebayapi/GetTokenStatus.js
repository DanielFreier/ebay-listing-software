var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');

module.exports = {
	
  call: function(request, callback) {
		
    async.waterfall([
      
      function(callback) {
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.find(
              {
                  email: 'yong_liu@me.com',
                userids2: {
                    $exists: true
                }
              }
            ).toArray(function(err, users) {
              
              callback(null, users, collection);
              
            }); // find
          }); // collection
        }); // mongo
      },
      
      function(users, collection, callback) {
        
        users.forEach(function(user) {
          user.userids2.forEach(function(userid) {
            if (!userid.hasOwnProperty('eBayAuthToken')) return;
            if (userid.eBayAuthToken == 'dummytoken') return;
            
            task.getnewtokenmap(user.email, function(err, token) {
              
              var requestjson = {
                email: user.email,
                callname: 'GetTokenStatus',
                site: 'US',
                siteid: 0,
                params: {
                  RequesterCredentials: {
                    eBayAuthToken: userid.eBayAuthToken
                  },
                  MessageID: token + ' ' + userid.username
                }
              };
              
              task.addqueue(requestjson, function(err, resultjson) {
                
                if (!resultjson.hasOwnProperty('TokenStatus')) return;
                
                console.log(userid.username + ' -> ' + resultjson.TokenStatus.Status);
                
                if (resultjson.hasOwnProperty('TokenStatus')) {
                  
                  collection.update(
                    {
                      email: user.email,
                      'userids2.username': userid.username
                    },
                    {
                      $set: {
                        'userids2.$.TokenStatus': resultjson.TokenStatus
                      }
                    }
                  );
                  
                }
                
              });
              
            }); // getnewtokenmap
            
          }); // userids2.forEach
        }); // users.forEach
        
        callback(null, null);
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call
	
}
