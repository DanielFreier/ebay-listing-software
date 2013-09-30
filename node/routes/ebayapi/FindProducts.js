var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');
var moment = require('moment');
var clone  = require('clone');

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
          callname: 'FindProducts',
          site: request.site,
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: ebayauthtoken
            },
            IncludeSelector: 'DomainHistogram',
            MaxEntries: 20,
            QueryKeywords: request.keyword,
            MessageID: token + ' ' + request.userid + ' ' + request.site + ' ' + request.keyword
          }
        };
        
        console.dir(requestjson);
        
        task.addqueue(requestjson, callback);
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call()
  
} // methods

module.exports = methods;
