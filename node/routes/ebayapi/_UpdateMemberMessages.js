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
                  'userids2.TokenStatus.Status': 'Active'
                },
                {
                  email: true,
                  userids2: true
                }
              ).sort({
                _id: -1
              }).toArray(function(err, users) {
                
                callback(null, db, users);
                
              }); // find
          }); // collection
        }); // mongo
      },
      
      function(db, users, callback) {
        
        users.forEach(function(user) {
          
          db.collection('items.' + user._id, function(err, itemscoll) {
            
            //'membermessages.MessageStatus': 'Unanswered'
            
            itemscoll.find(
              {
                org: {
                  $exists: true
                }
              }
            ).sort(
              {
                'org.ListingDetails.EndTime': 1
              }
            ).toArray(function(err, items) {
              
              if (items == null) return;
              if (items.length == 0) return;
              
              console.log(user.email + ' ' + items.length + ' items');
              
              for (var j = 0; j < items.length; j++) {
                
                var item = items[j];
                
                /* clear existing messages */
                itemscoll.update(
                  {
                    'org.ItemID': item.org.ItemID
                  },
                  {
                    $unset: {
                      'membermessages': ''
                    }
                  }
                );
                
                /* GetMemberMessages */
                var reqjson = {
                  email: user.email,
                  userid: item.org.Seller.UserID,
                  ItemID: item.org.ItemID
                };
                
                var getmm = require('./GetMemberMessages');
                getmm.call(reqjson, function(err, response) {
                  
                });
                
              } // for items
            });
            
          }) // db
          
        });
        
        callback(null, null);
        
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  }
  
} // methods

module.exports = methods;
