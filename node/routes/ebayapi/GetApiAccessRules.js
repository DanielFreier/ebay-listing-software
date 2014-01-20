var mongo      = require('../mongoconnect');
var taskmodule = require('./task');
var config     = require('../../config');
var async      = require('async');

module.exports = {
  
  call: function(request, callback) {
    
    async.waterfall([
      
      function(callback) {
        taskmodule.getnewtokenmap('admin@listers.in', callback);
      },
      
      function(token, callback) {
        
        var requestjson = {
          email: 'admin@listers.in',
          callname: 'GetApiAccessRules',
          site: 'US',
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: config.admintoken
            },
            MessageID: token + ' US'
          }
        };
        
        taskmodule.addqueue(requestjson, function(err, resultjson) {
          callback(null, resultjson);
        });
        
      },
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call
  
}
