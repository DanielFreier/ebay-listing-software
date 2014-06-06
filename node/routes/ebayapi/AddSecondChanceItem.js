var fs     = require('fs');
var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');
var moment = require('moment');
var clone  = require('clone');
var util   = require('util');

var methods = {
  
  call: function(request, callback) {
    
    console.log('===AddSecondChanceItem===');
    console.dir(request);
    
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
          callname: 'AddSecondChanceItem',
          site: 'US',
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: ebayauthtoken
            },
            WarningLevel: 'High',
            DetailLevel: 'ReturnAll',
            Duration:              request.Duration,
            ItemID:                request.ItemID,
            RecipientBidderUserID: request.RecipientBidderUserID,
            MessageID: token + ' ' + request.userid + ' ' + request.ItemID
          }
        };
        
        if (request.SellerMessage != '') {
          requestjson.SellerMessage = request.SellerMessage;
        }
        
        task.addqueue(requestjson, function(err, resultjson) {
          callback(null, token, ebayauthtoken, resultjson);
        });
      },
      
      function (token, ebayauthtoken, resultjson, callback) {
        
				console.dir(resultjson);
				
	      var reqjson = {
          email: request.email,
          userid: request.userid,
          ItemID: request.ItemID
        };
        
        var apimodule = require('./GetAllBidders');
        apimodule.call(reqjson, function(response) {
          callback(null, null);
        });
				
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call()
  
} // methods

module.exports = methods;
