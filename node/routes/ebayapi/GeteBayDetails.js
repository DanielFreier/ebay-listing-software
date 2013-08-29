var mongo      = require('../mongoconnect');
var taskmodule = require('./task');
var config     = require('../../config');
var async      = require('async');

module.exports = {
  
  call: function(request, callback) {
    
    console.log('GeteBayDetails');
    console.dir(request);
    
    async.waterfall([
      
      function(callback) {
        taskmodule.getnewtokenmap('admin@listers.in', callback);
      },
      
      function(token, callback) {
        
        var requestjson = {
          email: 'admin@listers.in',
          callname: 'GeteBayDetails',
          site: 'US',
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: config.admintoken
            },
            WarningLevel: 'High',
            MessageID: token + ' US'
          }
        };
        
        taskmodule.addqueue(requestjson, function(err, resultjson) {
          callback(null, token, resultjson);
        });
      },
      
      function(token, resultjson, callback) {
        
        resultjson.SiteDetails.forEach(function(doc) {
          console.dir(doc);
          
          var requestjson2 = {
            email: 'admin@listers.in',
            callname: 'GeteBayDetails',
            site: doc.Site,
            siteid: doc.SiteID,
            params: {
              RequesterCredentials: {
                eBayAuthToken: config.admintoken
              },
              WarningLevel: 'High',
              MessageID: token + ' ' + doc.Site
            }
          };
          
          taskmodule.addqueue(requestjson2, function(err, resultjson2) {
            
            var correlationid = resultjson2.CorrelationID.split(' ');
            var site = correlationid[1];
            
            mongo(function(db) {
              db.collection(site + '.eBayDetails', function(err, collection) {
                collection.remove({}, function() {
                  collection.insert(resultjson2);
                });
              });
            }); // mongo
            
          }); // addqueue
          
        }); // forEach
        
        callback(null, '');
      },
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call
  
}
