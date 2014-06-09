var async  = require('async');
var config = require('../../config');
var mongo  = require('../mongoconnect');
var task   = require('./task');

var methods = {
	
    call: function(request, callback) {
		
        console.log('FetchToken');
        console.dir(request);
        
        async.waterfall([
            
            function(callback) {
                task.getnewtokenmap(request.email, callback);
            },
            
            function(token, callback) {
                
                var requestjson = {
                    email: request.email,
                    callname: 'FetchToken',
                    site: 'US',
                    siteid: 0,
                    params: {
                        RequesterCredentials: {
                            eBayAuthToken: config.admintoken
                        },
                        SessionID: request.sessionid,
                        MessageID: token + ' ' + request.username
                    }
                };
                
                task.addqueue(requestjson, callback);
            },
            
            function (resultjson, callback) {
                
                resultjson.username = request.username;
                
                delete resultjson['@'];
                delete resultjson['Ack'];
                delete resultjson['CorrelationID'];
                delete resultjson['Version'];
                delete resultjson['Build'];
                
                var query = {
                    email: request.email
                };
                
                mongo(function(db) {
                    db.collection('users', function(err, collection) {
                        collection.update(
                            query,
                            {
                                $pull: {
                                    userids2: {
                                        username: request.username
                                    }
                                }
                            },
                            {
                                safe: true
                            },
                            function(err, result) {
                                collection.update(
                                    query,
                                    {
                                        $push: {
                                            'userids2': resultjson
                                        }
                                    },
                                    {
                                        safe: true
                                    },
                                    function(err, result) {
                                        callback(null, null);
                                    }
                                );
                            }
                        );
                    });
                }); // mongo
                
            }
            
        ], function(err, result) {
            
            callback(null, result);
            
        }); // async.waterfall
        
    } // call
	
} // methods

module.exports = methods;

