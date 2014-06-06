var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');

module.exports = {
	
  call: function(request, callback) {
		
    var query = {
      'userids2.TokenStatus.Status': 'Active'
    };
    
    if (request.hasOwnProperty('email')) {
      query.email = request.email;
    }
    
    if (request.hasOwnProperty('username')) {
      query['userids2.username'] = request.username;
    }
    
    async.waterfall([
      
      function(callback) {
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection
              .find(
                query,
                {
                  email: true,
                  userids2: true
                }
              )
              .sort({
                _id: -1
              })
              .toArray(function(err, users) {
                
                callback(null, users, collection);
                
              }); // find
          }); // collection
        }); // mongo
      },
      
      function(users, collection, callback) {
        
        users.forEach(function(user) {
          
          if (request.hasOwnProperty('email') && user.email != request.email) return;
          
          user.userids2.forEach(function(userid) {
            
            if (!userid.hasOwnProperty('eBayAuthToken')) return;
            if (!userid.hasOwnProperty('TokenStatus')) return;
            if (userid.eBayAuthToken == 'dummytoken') return;
            if (userid.TokenStatus.Status == 'RevokedByUser') return;
            
            if (request.hasOwnProperty('username')) {
              if (userid.username != request.username) return;
            }
            
            task.getnewtokenmap(user.email, function(err, token) {
              
              var requestjson = {
                email: user.email,
                callname: 'GetNotificationPreferences',
                site: 'US',
                siteid: 0,
                params: {
                  RequesterCredentials: {
                    eBayAuthToken: userid.eBayAuthToken
                  },
                  PreferenceLevel: 'User',
                  MessageID: token + ' ' + userid.username
                }
              };
              
              task.addqueue(requestjson, function(err, resultjson) {
                
                if (!resultjson.hasOwnProperty('UserDeliveryPreferenceArray')) return;
                
                var udpane = resultjson.UserDeliveryPreferenceArray.NotificationEnable;
                
                collection.update(
                  {
                    email: user.email,
                    'userids2.username': userid.username
                  },
                  {
                    $set: {
                      'userids2.$.NotificationEnable': udpane
                    }
                  }
                );
              });
              
            }); // getnewtokenmap
            
          }); // userids2.forEach
        }); // users.forEach
        
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call
	
}
