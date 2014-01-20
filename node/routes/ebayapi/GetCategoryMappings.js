var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');
var clone  = require('clone');

module.exports = {
  
  call: function(request, callback) {
    
    console.log('GetCategoryMappings');
    
    async.waterfall([
      
      function(callback) {
        task.getnewtokenmap('admin@listers.in', callback);
      },
      
      function(token, callback) {
        
        mongo(function(db) {
          db.collection('US.eBayDetails', function(err, collection) {
            collection.findOne({}, function(err, document) {
              document.SiteDetails.forEach(function(doc) {
                
                var requestjson = {
                  email: 'admin@listers.in',
                  callname: 'GetCategoryMappings',
                  site: doc.Site,
                  siteid: doc.SiteID,
                  params: {
                    RequesterCredentials: {
                      eBayAuthToken: config.admintoken
                    },
                    WarningLevel: 'High',
                    DetailLevel: 'ReturnAll',
                    MessageID: token + ' ' + doc.Site
                  }
                };
                
                task.addqueue(requestjson, function(err, resultjson) {
                  
                  var correlationid = resultjson.CorrelationID.split(' ');
                  var site = correlationid[1];
                  
                  db.collection(site + '.CategoryMappings.ready', function(err, coll) {
                    
                    task.convertattr(resultjson.CategoryMapping);
                    
                    coll.remove({}, function() {
                      coll.insert(resultjson.CategoryMapping);
                    });
                  });
                  
                }); // addqueue
                
              }); // forEach
            }); // findOne
          }); // collection
        }); // mongo
        
        callback(null, '');
      },
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call
  
}
