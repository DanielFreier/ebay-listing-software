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
          callname: 'GetItem',
          site: 'US',
          siteid: 0,
          params: {
            RequesterCredentials: {
              eBayAuthToken: ebayauthtoken
            },
            WarningLevel: 'High',
            DetailLevel: 'ReturnAll',
            IncludeCrossPromotion: 'true',
            IncludeItemCompatibilityList: 'true',
            IncludeItemSpecifics: 'true',
            IncludeTaxTable: 'true',
            IncludeWatchCount: 'true',
            ItemID: request.ItemID,
            MessageID: token + ' ' + request.userid + ' ' + request.ItemID
          }
        };
        
        task.addqueue(requestjson, function(err, resultjson) {
          callback(null, token, ebayauthtoken, resultjson);
        });
      },
      
      function (token, ebayauthtoken, resultjson, callback) {
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.findOne({email: request.email}, function(err, document) {
              db.collection('items.' + document._id, function(err, collection) {
                callback(null, token, ebayauthtoken, resultjson, collection);
              });
            });
          });
        }); // mongo
      },
      
      function (token, ebayauthtoken, resultjson, collection, callback) {
        if (resultjson.Item == '') {
          
          var correlationid = resultjson.CorrelationID.split(' ');
          var deleteitemid = correlationid[2];
          
          collection.remove({
            'org.ItemID': deleteitemid
          });
          
        } else {
          methods.upsert(resultjson.Item, collection);
        }
        callback(null, null);
      }
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  }, // call()
  
  upsert: function(org, collection, callback) {
    
    convertattr(org);
    
    /* int */
    for (var i=0; i<config.intfield.length; i++) {
      
      var orgref = org;
      var path = config.intfield[i].split('.');
      while (path.length > 0) {
        if (!orgref.hasOwnProperty(path[0])) break;
        
        if (path.length == 1) {
          orgref[path[0]] = parseInt(orgref[path[0]]);
          break;
        }
        
        var shifted = path.shift();
        orgref = orgref[shifted];
      }
    }
    
    /* double */
    for (var i=0; i<config.doublefield.length; i++) {
      
      var orgref = org;
      var path = config.doublefield[i].split('.');
      while (path.length > 0) {
        if (!orgref.hasOwnProperty(path[0])) break;
        
        if (path.length == 1) {
          orgref[path[0]] = parseFloat(orgref[path[0]]);
          break;
        }
        
        var shifted = path.shift();
        orgref = orgref[shifted];
      }
    }
    
    /* date */
    for (var i=0; i<config.datefield.length; i++) {
      
      var orgref = org;
      var path = config.datefield[i].split('.');
      while (path.length > 0) {
        if (!orgref.hasOwnProperty(path[0])) break;
        
        if (path.length == 1) {
          //orgref[path[0]] = 'ISODate(' + orgref[path[0]] + ')';
          orgref[path[0]] = moment(orgref[path[0]])._d;
          break;
        }
        
        var shifted = path.shift();
        orgref = orgref[shifted];
      }
    }
    
    /* Copy org */
    var mod = clone(org);
    
		/* Delete fields which is not necessary in AddItem families */
    for (var i=0; i<config.removefield.length; i++) {
      
      var modref = mod;
      var path = config.removefield[i].split('.');
      while (path.length > 0) {
        if (!modref.hasOwnProperty(path[0])) break;
        
        if (path.length == 1) {
          delete modref[path[0]];
          break;
        }
        
        var shifted = path.shift();
        modref = modref[shifted];
      }
    }
    
		/* Delete ItemSpecifics which added from Product */
    if (mod.hasOwnProperty('ItemSpecifics')) {
      var nvlist = mod.ItemSpecifics.NameValueList;
      for (var idx = nvlist.length-1; idx >= 0; idx--) {
        if (nvlist[idx].Source == 'Product') {
          nvlist.splice(idx, 1);
        }
      }
    }
    
    /* Delete ReservePrice if 0 */
    
    /* Delete BuyItNowPrice if 0 */
    
    /* Delete mod.ShippingPackageDetails */
    if (mod.hasOwnProperty('ShippingPackageDetails')) {
      if (mod.ShippingPackageDetails == null || mod.ShippingPackageDetails == '') {
        
      } else {
        var weightmajor = mod.ShippingPackageDetails.WeightMajor['#text'];
        var weightminor = mod.ShippingPackageDetails.WeightMinor['#text'];
        
        if (weightmajor == 0 && weightminor == 0) {
          delete mod.ShippingPackageDetails;
        }
      }
    }
    
		/* Remove banner from description */
    if (mod.Description != null) {
      mod.Description = mod.Description.replace(/<div id="listersin-banner".+?<\/div>/, '');
    }
    
    /* Insert or update */
    collection.update(
      {
        'org.ItemID': org.ItemID
      },
      {
        $set: {
          UserID: org.Seller.UserID,
          mod: mod,
          org: org,
          error: null
        }
      },
      {
        upsert: true
      }
    );
    
  } // upsert()

} // methods

module.exports = methods;

// todo: use task.convertattr
function convertattr(o) {
  
  Object.keys(o).forEach(function(key) {
    
    if (key == '@') {
      Object.keys(o[key]).forEach(function(attrkey) {
        o['@' + attrkey] = o[key][attrkey];
      });
      delete o[key];
    } else if (typeof(o[key]) == 'object') {
      convertattr(o[key]);
    }
    
  });
  
  return o;
}
