var mongo      = require('../mongoconnect');
var taskmodule = require('./task');
var config     = require('../../config');
var async      = require('async');
var clone      = require('clone');

module.exports = {
  
  call: function(request, callback) {
    
    console.log('GetDescriptionTemplates');
    
    async.waterfall([
      
      function(callback) {
        taskmodule.getnewtokenmap('admin@listers.in', callback);
      },
      
      function(token, callback) {
        
        mongo(function(db) {
          
          db.collection('US.eBayDetails', function(err, collection) {
            
            collection.findOne({}, function(err, document) {
              
              document.SiteDetails.forEach(function(doc) {
                
                //if (doc.Site != 'Italy') return;
                
                var requestjson = {
                  email: 'admin@listers.in',
                  callname: 'GetDescriptionTemplates',
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
                
                taskmodule.addqueue(requestjson, function(err, resultjson) {
                  
                  var correlationid = resultjson.CorrelationID.split(' ');
                  var site = correlationid[1];
                  
                  db.collection
                  (site + '.DescriptionTemplates.DescriptionTemplate.ready', 
                   function(err, collection) {
                     collection.remove({}, function() {
                       collection.insert(resultjson.DescriptionTemplate);
                     });
                   });
                  
                  if (resultjson.hasOwnProperty('ThemeGroup')) {
                    
                    db.collection
                    (site + '.DescriptionTemplates.ThemeGroup.ready', 
                     function(err, collection) {
                       collection.remove({}, function() {
                         collection.insert(resultjson.ThemeGroup);
                       });
                     });
                    
                  }
                  
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
