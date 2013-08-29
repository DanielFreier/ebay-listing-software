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
          callname: 'GetMemberMessages',
          site: 'US',
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: ebayauthtoken
            },
            WarningLevel: 'High',
            DetailLevel: 'ReturnAll',
            MailMessageType: 'All',
            MessageID: token + ' ' + request.userid
          }
        };
        if (request.ItemID) {
          requestjson.params['ItemID'] = request.ItemID;
          requestjson.params['MessageID'] += ' ' + request.ItemID;
        } else {
          requestjson.params['StartCreationTime'] = request.StartCreationTime;
          requestjson.params['EndCreationTime']   = request.EndCreationTime;
        }
        
        task.addqueue(requestjson, function(err, resultjson) {
          callback(null, token, ebayauthtoken, resultjson);
        });
      },
      
      function (token, ebayauthtoken, resultjson, callback) {
        
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.findOne({email: request.email}, function(err, usercoll) {
              
              db.collection('items.' + usercoll._id, function(err, itemcoll) {
                callback(null, token, ebayauthtoken, resultjson, itemcoll);
              });
              
            }); // findOne
          }); // collection
        }); // mongo
        
      },
      
      function (token, ebayauthtoken, resultjson, itemcoll, callback) {
        
        //console.log('count: ' + resultjson.PaginationResult.TotalNumberOfEntries);
        
        if (resultjson.PaginationResult.TotalNumberOfEntries > 0) {
          var mme = resultjson.MemberMessage.MemberMessageExchange;
          for (var idx = mme.length-1; idx >= 0; idx--) {
            methods.upsert(request.email, mme[idx], itemcoll);
          }
        }
        
        callback(null, null);
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  }, // call()
  
  upsert: function(email, mme, itemcoll, callback) {
    
    if (mme.Question.MessageType != 'AskSellerQuestion') return;
    if (typeof(mme.Item) == 'undefined') return;
    
    var itemid = mme.Item.ItemID;
    var userid = mme.Item.Seller.UserID;
    var messageid = mme.Question.MessageID;
    
    /* GetItem if the item does not exist. */
    itemcoll.findOne({'org.ItemID': itemid}, function(err, document) {
      if (document == null) {
        console.log('itemid:' + itemid + ' null -> GetItem');
        
        /* GetItem */
	      var reqjson = {
          email: email,
          userid: userid,
          ItemID: itemid
        };
        
        var apimodule = require('./GetItem');
        apimodule.call(reqjson, function(response) {
          methods.upsert2(mme, itemcoll);
        });
        
      } else {
        
        methods.upsert2(mme, itemcoll);
        
      }
    })
  }, // upsert()
  
  upsert2: function(mme, itemcoll, callback) {
    
    var itemid = mme.Item.ItemID;
    var userid = mme.Item.Seller.UserID;
    var messageid = mme.Question.MessageID;
    
    delete mme.Item;
    
    mme.CreationDate     = moment(mme.CreationDate)._d;
    mme.LastModifiedDate = moment(mme.LastModifiedDate)._d;
    
    /* Remove existing message */
    itemcoll.update(
      {
        'org.ItemID': itemid
      },
      {
        $pull: {
          membermessages: {
            'Question.MessageID': messageid
          }
        }
      },
      function(err, result) {
        
        /* Insert new message */
        itemcoll.update(
          {
            'org.ItemID': itemid
          },
          {
            $push: {
              membermessages: mme
            }
          }
        );
        
      }
    );
    
    return;
    
  } // upsert2()
  
} // methods

module.exports = methods;
