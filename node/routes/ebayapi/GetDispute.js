var fs     = require('fs');
var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');
var moment = require('moment');
var clone  = require('clone');
var util   = require('util');
var ObjectID = require('mongodb').ObjectID;

var methods = {
  
  call: function(request, callback) {
    
    // todo: implement normal call
    
  }, // call()
  
  upsert: function(dispute, collection, callback) {
    
    var query = {
      'org.ItemID': dispute.Item.ItemID
    };
    
    collection.update(
      query,
      {
        $pull: {
          disputes: {
            DisputeID: dispute.DisputeID
          }
        }
      },
      {
        safe: true
      },
      function (err, result) {
        
        collection.update(
          query,
          {
            $push: {
              disputes: dispute
            }
          }
        );
        
        //callback(null, null);
      }
    ); // update()
    
  }, // upsert()
  
} // methods

module.exports = methods;
