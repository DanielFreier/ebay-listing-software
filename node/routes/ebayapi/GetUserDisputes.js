var fs     = require('fs');
var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');
var moment = require('moment');
var clone  = require('clone');
var util   = require('util');
var getdispute = require('./GetDispute');

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
          callname: 'GetUserDisputes',
          site: 'US',
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: ebayauthtoken
            },
            WarningLevel: 'High',
            DetailLevel: 'ReturnAll',
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
        methods.upsert(resultjson.DisputeArray.Dispute, collection);
        callback(null, null);
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  }, // call()
  
  upsert: function(disputes, collection, callback) {
    
    if (!util.isArray(disputes)) {
      disputes = [disputes];
    }
    
    disputes.forEach(function(dispute) {
      
      if (dispute == null) return;
      if (!dispute.hasOwnProperty('Item')) return;
      
      console.log(dispute.Item.ItemID + ' ' + dispute.DisputeID);
      
      getdispute.upsert(dispute, collection, callback);
      
      /*
      collection.update(
        {
          'org.ItemID': dispute.Item.ItemID
        },
        {
          $push: {
            disputes: dispute
          }
        }
      );
      */
      
    });
    
  }
  
} // methods

module.exports = methods;
