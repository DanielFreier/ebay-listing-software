var async  = require('async');
var config = require('../../config');
var mongo  = require('../mongoconnect');
var task   = require('./task');

var methods = {
	
    call: function(request, callback) {
		
        async.waterfall([
            
            function(callback) {
                task.getnewtokenmap(request.email, callback);
            },
            
            function(token, callback) {
                task.getebayauthtoken(request.email,
                                      request.username,
                                      function(err, ebayauthtoken) {
                                          callback(null, token, ebayauthtoken);
                                      });
            },
            
            function(token, ebayauthtoken, callback) {
                
                var events = [
                    'BidPlaced',
                    'BidReceived',
                    'EndOfAuction',
                    'Feedback',
                    'FeedbackLeft',
                    'FeedbackReceived',
                    'FeedbackStarChanged',
                    'FixedPriceTransaction',
                    'INRBuyerOpenedDispute',
                    'ItemClosed',
                    'ItemExtended',
                    'ItemListed',
                    'ItemRevised',
                    'ItemSold',
                    'ItemUnsold',
                    'ItemSuspended',
                    'ItemLost',
                    'ItemWon',
                    'AskSellerQuestion',
                    'SellerOpenedDispute',
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
            }
            
        ], function(err, result) {
            
            callback(null, result);
            
        }); // async.waterfall
        
    } // call
	
} // methods

module.exports = methods;
