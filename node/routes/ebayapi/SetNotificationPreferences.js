var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');

module.exports = {
	
  call: function(request, callback) {
		
    console.log('SetNotificationPreferences');
    console.dir(request);
    
    async.waterfall([
      
      function(callback) {
        task.getnewtokenmap(request.email, callback);
      },
      
      function(token, callback) {
        task.getebayauthtoken(request.email, request.username, function(err, ebayauthtoken) {
          callback(null, token, ebayauthtoken);
        });
      },
      
      function(token, ebayauthtoken, callback) {
        
        var events = [
          'ItemListed',
          'EndOfAuction',
          'ItemClosed',
          'ItemExtended',
          'ItemRevised',
          'ItemSold',
          'ItemUnsold',
          'ItemSuspended',
          'ItemLost',
          'AskSellerQuestion',
          'TokenRevocation',
          'UserIDChanged',
          'MyMessageseBayMessage',
          'MyMessagesM2MMessage'
        ];
        
        var eventenable = 'Enable';
        
        if (request.hasOwnProperty('disable')) {
          eventenable = 'Disable';
        }
        
        var ane = [];
        for (var i = 0; i < events.length; i++) {
          var ne = {
            EventType: events[i],
            EventEnable: eventenable
          }
          ane.push(ne);
        }
        
        var requestjson = {
          email: request.email,
          callname: 'SetNotificationPreferences',
          site: 'US',
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: ebayauthtoken
            },
            ApplicationDeliveryPreferences: {
              ApplicationEnable: 'Enable',
              ApplicationURL: 'http://' + config.hostname + '/node/receivenotify'
            },
            UserDeliveryPreferenceArray: {
              NotificationEnable: ane
            },
            MessageID: token + ' ' + request.username
          }
        };
        
        task.addqueue(requestjson, callback);
      },
      
      function(resultjson, callback) {
        
        callback(null, null);
        /*
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            
            collection.update(
              {
                email: request.email
              },
              {
                $set: {
                  sessionid: resultjson.SessionID
                }
              }
            );
            
            callback(null, resultjson.SessionID);
            
          });
        }); // mongo
        */
      }
        
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call
	
}
