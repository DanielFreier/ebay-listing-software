var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');

module.exports = {
	
    call: function(request, callback) {
		
        console.log('GetUser');
        console.dir(request);
        
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
                    callname: 'GetUser',
                    site: 'US',
                    siteid: 0,
                    params: {
                        RequesterCredentials: {
                            eBayAuthToken: ebayauthtoken
                        },
                        MessageID: token + ' ' + request.username
                    }
                };
                
                task.addqueue(requestjson, function(err, resultjson) {
                    callback(null, token, ebayauthtoken, resultjson);
                });
            },
            
            function (token, ebayauthtoken, resultjson, callback) {
                if (!resultjson.hasOwnProperty('User')) {
                    callback(null, null);
                    return;
                }
                    
                mongo(function(db) {
                    db.collection('users', function(err, collection) {
                        
                        if (request.username != resultjson.User.UserID) {
                            console.log(request.username + ' -> ' + resultjson.User.UserID);
                            
                            /* Update if username is changed */
                            collection.update(
                                {
                                    email: request.email,
                                    'userids2.username': request.username
                                },
                                {
                                    $set: {
                                        'userids2.$.username': resultjson.User.UserID
                                    }
                                }
                            );
                        }
                        
                        collection.update(
                            {
                                email: request.email,
                                'userids2.username': request.username
                            },
                            {
                                $set: {
                                    'userids2.$.User': resultjson.User
                                }
                            }
                        );
                        
                        callback(null, null);
                    });
                });
                
            }
            
        ], function(err, result) {
            
            callback(null, result);
            
        }); // async.waterfall
        
    } // call
	
}
