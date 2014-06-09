var async  = require('async');
var config = require('../../config');
var mongo  = require('../mongoconnect');
var task   = require('./task');

var methods = {
	
    call: function(request, callback) {
		
        async.waterfall([
            
            function(callback) {
                task.getnewtokenmap(request.email, callback);
            },
            
            function(token, callback) {
                task.getebayauthtoken(request.email,
                                      request.username,
                                      function(err, ebayauthtoken) {
                                          callback(null, token, ebayauthtoken);
                                      });
            },
            
            function(token, ebayauthtoken, callback) {
                
                var requestjson = {
                    email: request.email,
                    callname: 'GetNotificationPreferences',
                    site: 'US',
                    siteid: 0,
                    params: {
                        RequesterCredentials: {
                            eBayAuthToken: ebayauthtoken
                        },
                        PreferenceLevel: 'User',
                        MessageID: token + ' ' + request.username
                    }
                };
                
                task.addqueue(requestjson, function(err, resultjson) {
                    
                    if (!resultjson.hasOwnProperty('UserDeliveryPreferenceArray')) return;
                    
                    var udpane = resultjson.UserDeliveryPreferenceArray.NotificationEnable;
                    
                    mongo(function(db) {
                        db.collection('users', function(err, collection) {
                            
                            collection.update(
                                {
                                    email: request.email,
                                    'userids2.username': request.username
                                },
                                {
                                    $set: {
                                        'userids2.$.NotificationEnable': udpane
                                    }
                                },
                                {
                                    safe: true
                                },
                                function(err, result) {
                                    callback(null, null);
                                }
                            ); // update
                            
                        }); // collection
                    }); // mongo
                    
                }); // task.addqueue
                
            }
            
        ], function(err, result) {
            
            callback(null, result);
            
        }); // async.waterfall
        
    } // call
	
} // methods

module.exports = methods;
