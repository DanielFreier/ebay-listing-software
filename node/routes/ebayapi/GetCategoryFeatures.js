var mongo      = require('../mongoconnect');
var taskmodule = require('./task');
var config     = require('../../config');
var async      = require('async');
var clone      = require('clone');

module.exports = {
  
  call: function(request, callback) {
    
    console.log('GetCategoryFeatures');
    
    async.waterfall([
      
      function(callback) {
        taskmodule.getnewtokenmap('admin@listers.in', callback);
      },
      
      function(token, callback) {
        
        mongo(function(db) {
          
          db.collection('US.eBayDetails', function(err, collection) {
            
            collection.findOne({}, function(err, document) {
              
              document.SiteDetails.forEach(function(doc) {
                
                if (doc.Site != 'US') return;
                
                var requestjson = {
                  email: 'admin@listers.in',
                  callname: 'GetCategoryFeatures',
                  site: doc.Site,
                  siteid: doc.SiteID,
                  params: {
                    RequesterCredentials: {
                      eBayAuthToken: config.admintoken
                    },
                    WarningLevel: 'High',
                    DetailLevel: 'ReturnAll',
                    ViewAllNodes: 'true',
                    MessageID: token + ' ' + doc.Site
                  }
                };
                
                taskmodule.addqueue(requestjson, function(err, resultjson) {
                  
                  var correlationid = resultjson.CorrelationID.split(' ');
                  var site = correlationid[1];
                  
                  var resultcopy = clone(resultjson);
                  
                  db.collection
                  (site + '.CategoryFeatures', function(err, collection) {
                    collection.remove({}, function() {
                      delete resultjson.Category;
                      collection.insert(resultjson);
                    });
                  });
                  
                  db.collection
                  (site + '.CategoryFeatures.Category', function(err, collection) {
                    collection.remove({}, function() {
                      collection.insert(resultcopy.Category);
                    });
                  });
                  
                });
                
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
