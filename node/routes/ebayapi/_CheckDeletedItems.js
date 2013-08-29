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
        
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection
              .find(
                {
                  'email': 'carmenava11@gmail.com',
                  'userids2.TokenStatus.Status': 'Active'
                },
                {
                  email: true,
                  userids2: true
                }
              )
              .sort(
                {
                  _id: 1
                }
              )
              .limit(10)
              .toArray(function(err, users) {
                
                callback(null, db, users);
                
              }); // find
          }); // collection
        }); // mongo
      },
      
      function(db, users, callback) {
        
        for (var i = 0; i < users.length; i++) {
          
          var user = users[i];
          console.log(user.email);
          
          db.collection('items.' + user._id, function(err, itemscoll) {
            
            itemscoll.find(
              {
                org: {
                  $exists: 1
                },
                'org.SellingStatus.ListingStatus': 'Active'
              }
            ).sort(
              {
                'org.ListingDetails.EndTime': 1
              }
            ).limit(10).toArray(function(err, items) {
              for (var j = 0; j < items.length; j++) {
                
                var item = items[j];
                console.log(item.org.Seller.UserID + ': ' + item.org.ItemID);
                
                /* GetItem */
                var reqjson = {
                  email: user.email,
                  userid: item.org.Seller.UserID,
                  ItemID: item.org.ItemID
                };
                
                var getitem = require('./GetItem');
                getitem.call(reqjson, function(err, response) {
                });
              }
            });
          })
        }
        
        callback(null, null);
        
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  }
  
} // methods

module.exports = methods;
