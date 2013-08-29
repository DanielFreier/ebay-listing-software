var mongo = require('../mongoconnect');
var taskmodule = require('./task');
var config = require('../../config');
var async = require('async');

module.exports = {
  
  call: function(request, callback) {
    
    console.log('GetSellerList');
    console.dir(request);
    
    async.waterfall([
      
      function(callback) {
        taskmodule.getnewtokenmap(request.email, callback);
      },
      
      function(token, callback) {
        taskmodule.getebayauthtoken(request.email, request.userid, function(err, ebayauthtoken) {
          callback(null, token, ebayauthtoken);
        });
      },
      
      function(token, ebayauthtoken, callback) {
        
        var messageid = token;
        messageid += ' ' + request.userid;
        messageid += ' ' + request.daterange;
        messageid += ' ' + request.datestart;
        messageid += ' ' + request.dateend;
        
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
              EntriesPerPage: 50,
              PageNumber: 1
            },
            Sort: 2,
            MessageID: messageid
          }
        };
        
        requestjson.params[request.daterange + 'TimeFrom'] = request.datestart + ' 00:00:00';
        requestjson.params[request.daterange + 'TimeTo']   = request.dateend   + ' 00:00:00';
        
        //console.log(requestjson);
        
        taskmodule.addqueue(requestjson, callback);
      },
      
      function (resultjson, callback) {
        
        console.log('item count: ' + resultjson.ItemArray.Item.length);
        
        resultjson.ItemArray.Item.forEach(function(org) {
          return;
          
          var mod = org;
          
          var query = {
            org: {
              ItemID: org.ItemID
            }
          };
          
          var item = {
            mod: mod,
            org: org
          };
          
          mongo(function(db) {
            db.collection('items.' + ebayuser._id +'.node', function(err, collection) {
              collection.update(
                query,
                item,
                {upsert: true}
              );
            });
          }); // mongo
          
        }); // forEach
        
        callback(null, 'last');
      }
      
    ], function(err, result) {
      
      console.dir(result);
      callback(null, result);
      
    });
    
    /*
    mongo(function(db) {
      
      db.collection('users', function(err, collection) {
        collection.find({email: request.email}).toArray(function(err, users) {
          users[0].userids2.forEach(function(ebayuser) {
            if (ebayuser.username != request.userid) return;
            
            
            
            taskmodule.addqueue(requestjson, function(resultjson) {
              
              resultjson.ItemArray.Item.forEach(function(org) {
                console.dir(org.Title);
                
                var mod = org;
                
                var query = {
                  org: {
                    ItemID: org.ItemID
                  }
                };
                
                var item = {
                  mod: mod,
                  org: org
                };
                
                mongo(function(db) {
                  db.collection('items.' + ebayuser._id +'.node', function(err, collection) {
                    collection.update(
                      query,
                      item,
                      {upsert: true}
                    );
                  });
                }); // mongo
                
              });
              callback('');
              //resultjson.
              
            });
            
          }); // forEach
          
        }); // find
        
      }); // collection
      
    }); // mongo
    
    */
  }
}
