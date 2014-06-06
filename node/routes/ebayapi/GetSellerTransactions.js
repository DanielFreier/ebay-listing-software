var fs     = require('fs');
var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');
var moment = require('moment');
var clone  = require('clone');
var util   = require('util');
var getitemtransactions = require('./GetItemTransactions');

var methods = {
    
    call: function(request, callback) {
        
        async.waterfall([
            
            function(callback) {
                task.getnewtokenmap(request.email, callback);
            },
            
            function(token, callback) {
                task.getebayauthtoken(request.email, request.userid, function(err, ebayauthtoken) {
                    callback(null, token, ebayauthtoken);
                });
            },
            
            function(token, ebayauthtoken, callback) {
                
                var requestjson = {
                    email: request.email,
                    callname: 'GetSellerTransactions',
                    site: 'US',
                    siteid: 0,
                    params: {
                        RequesterCredentials: {
                            eBayAuthToken: ebayauthtoken
                        },
                        WarningLevel: 'High',
                        DetailLevel: 'ReturnAll',
                        ModTimeFrom: '2014-05-10',
                        ModTimeTo: '2014-06-05',
                        MessageID: token + ' ' + request.userid
                    }
                };
                
                task.addqueue(requestjson, function(err, resultjson) {
                    callback(null, token, ebayauthtoken, resultjson);
                });
            },
            
            function (token, ebayauthtoken, resultjson, callback) {
                mongo(function(db) {
                    db.collection('users', function(err, collection) {
                        collection.findOne({email: request.email}, function(err, document) {
                            db.collection('items.' + document._id, function(err, collection) {
                                callback(null, token, ebayauthtoken, resultjson, collection);
                            });
                        });
                    });
                }); // mongo
            },
            
            function (token, ebayauthtoken, resultjson, collection, callback) {
                if (!resultjson.hasOwnProperty('TransactionArray')) {
                    callback(null, null);
                    return;
                }
                
                methods.upsert(resultjson.TransactionArray.Transaction, collection);
                callback(null, null);
            }
            
        ], function(err, result) {
            
            callback(null, result);
            
        }); // async.waterfall
        
    }, // call()
    
    upsert: function(transactions, collection, callback) {
        
        getitemtransactions.upsert(transactions, collection, callback);
        
    }
    
    
} // methods

module.exports = methods;
