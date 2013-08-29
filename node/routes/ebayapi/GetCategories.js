var mongo      = require('../mongoconnect');
var taskmodule = require('./task');
var config     = require('../../config');
var async      = require('async');

module.exports = {
  
  call: function(request, callback) {
    
    console.log('GetCategories');
    console.dir(request);
    
    async.waterfall([
      
      function(callback) {
        taskmodule.getnewtokenmap('admin@listers.in', callback);
      },
      
      function(token, callback) {
        
        mongo(function(db) {
          
          db.collection('US.eBayDetails', function(err, collection) {
            
            collection.findOne({}, function(err, document) {
              
              document.SiteDetails.forEach(function(doc) {
                
                var requestjson = {
                  email: 'admin@listers.in',
                  callname: 'GetCategories',
                  site: doc.Site,
                  siteid: doc.SiteID,
                  params: {
                    RequesterCredentials: {
                      eBayAuthToken: config.admintoken
                    },
                    CategorySiteID: doc.SiteID,
                    WarningLevel: 'High',
                    DetailLevel: 'ReturnAll',
                    MessageID: token + ' ' + doc.Site
                  }
                };
                
                taskmodule.addqueue(requestjson, function(err, resultjson) {
                  
                  var correlationid = resultjson.CorrelationID.split(' ');
                  var site = correlationid[1];
                  
                  console.log('result: ' + site);
                  
                  db.collection(site + '.Categories', function(err, collection) {
                    collection.remove({}, function() {
                      collection.insert(resultjson.CategoryArray.Category);
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
