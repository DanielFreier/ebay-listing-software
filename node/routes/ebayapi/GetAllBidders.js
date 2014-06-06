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
          callname: 'GetAllBidders',
          site: 'US',
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: ebayauthtoken
            },
            WarningLevel: 'High',
            DetailLevel: 'ReturnAll',
            //CallMode: 'ViewAll',
            CallMode: 'SecondChanceEligibleEndedListing',
            IncludeBiddingSummary: 'true',
            ItemID: request.ItemID,
            MessageID: token + ' ' + request.userid + ' ' + request.ItemID
          }
        };
        
        task.addqueue(requestjson, function(err, resultjson) {
          callback(null, token, ebayauthtoken, resultjson);
        });
      },
      
      function (token, ebayauthtoken, resultjson, callback) {
        
        if (util.isArray(resultjson.BidArray.Offer)) {
          bids = resultjson.BidArray.Offer;
        } else {
          bids = [resultjson.BidArray.Offer];
        }
        
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.findOne({email: request.email}, function(err, document) {
              db.collection('items.' + document._id, function(err, collection) {
                
                var update = {};
                
                if (!resultjson.BidArray.hasOwnProperty('Offer')) {
                  
                  console.log('unset bids');
                  
                  update = {
                    $unset: {
                      bids: true
                    }
                  };
                  
                } else {
                  
                  console.log(bids.length + ' bids');
                  
                  update = {
                    $set: {
                      bids: bids
                    }
                  };
                  
                }
                
                collection.update(
                  {
                    'org.ItemID': request.ItemID
                  },
                  update
                );
                
                callback(null, null);
              });
            });
          });
        }); // mongo
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call()
  
} // methods

module.exports = methods;
