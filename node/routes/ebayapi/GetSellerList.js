var fs      = require('fs');
var mongo   = require('../mongoconnect');
var task    = require('./task');
var config  = require('../../config');
var async   = require('async');
var moment  = require('moment');
var clone   = require('clone');
var getitem = require('./GetItem');

module.exports = {
  
  call: function(request, callback) {
    
    console.log('GetSellerList');
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
          callname: 'GetSellerList',
          site: 'US',
          siteid: 0,
          params: {
            WarningLevel: 'High',
            RequesterCredentials: {
              eBayAuthToken: ebayauthtoken
            },
            Pagination: {
              EntriesPerPage: 9,
              PageNumber: 1
            },
            MessageID: token + ' ' + request.userid + ' 0'
          }
        };
        
        requestjson.params[request.daterange + 'TimeFrom'] = request.datestart + ' 00:00:00';
        requestjson.params[request.daterange + 'TimeTo']   = request.dateend   + ' 00:00:00';
        
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
        
        var pages = resultjson.PaginationResult.TotalNumberOfPages;
        var total = resultjson.PaginationResult.TotalNumberOfEntries;
        
        task.updatemessage(request.email, true, 'Importing ' + total + ' items from eBay.');
        
        async.times(pages, function(pagenumber, callback) {
          
          var messageid = token;
          messageid += ' ' + request.userid;
          messageid += ' ' + (pagenumber + 1);
          
          var requestjson = {
            email: request.email,
            callname: 'GetSellerList',
            site: 'US',
            siteid: 0,
            params: {
              DetailLevel: 'ReturnAll',
              IncludeWatchCount: 'true',
              IncludeVariations: 'true',
              WarningLevel: 'High',
              RequesterCredentials: {
                eBayAuthToken: ebayauthtoken
              },
              Pagination: {
                EntriesPerPage: 9,
                PageNumber: (pagenumber + 1)
              },
              Sort: 2,
              MessageID: messageid
            }
          };
          
          requestjson.params[request.daterange + 'TimeFrom'] = request.datestart + ' 00:00:00';
          requestjson.params[request.daterange + 'TimeTo']   = request.dateend   + ' 00:00:00';
          
          task.addqueue(requestjson, function(err, resultjson2) {
            
            var seller = clone(resultjson2.Seller);
            
            if (Array.isArray(resultjson2.ItemArray.Item)) {
              
              resultjson2.ItemArray.Item.forEach(function(org) {
                
                org.Seller = seller;
                getitem.upsert(org, collection);
                
              }); // forEach
              
            } else {
              
              resultjson2.ItemArray.Item.Seller = seller;
              getitem.upsert(resultjson2.ItemArray.Item, collection);
              
            }
            
            callback(null, null);
          });
          
        }, function(err, result) {
          
          callback(null, total);
          
        });
        
      }
      
    ], function(err, total) {
      
      task.updatemessage(request.email, false,
                         'Imported ' + total + ' items from eBay.');
      
      callback(null, null);
      
    }); // async.waterfall
    
  } // call
  
} // exports
