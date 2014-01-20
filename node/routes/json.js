var mongo  = require('../routes/mongoconnect');
var moment = require('moment');
var net    = require('net');
var config = require('../config');
var async  = require('async');
var clone  = require('clone');
var fs     = require('fs');
var ObjectID = require('mongodb').ObjectID;
var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates')
var crypto = require('crypto');
var util   = require('util');

var now = new Date();

var sellingquery = {
  
  allitems: {
  },
  
  scheduled: {
    $or: [
      {'mod.ScheduleTime': {$gt: now}},
      {'opt.ScheduleTime': {$gt: now}},
      {'org.ListingDetails.StartTime': {$gt: now}}
    ]
  },
  
  active: {
    'org.ItemID': {$exists: true},
    'org.SellingStatus.ListingStatus': 'Active',
    'org.ListingDetails.StartTime': {$lt: now}
  },
  
  sold: {
    'org.ItemID': {$exists: true},
    'org.SellingStatus.QuantitySold': {$gte: 1} 
  },
  
  unsold: {
    'org.ItemID': {$exists: true},
    'org.SellingStatus.ListingStatus': 'Completed',
    'org.SellingStatus.QuantitySold': 0
  },
  
  unanswered: {
    'org.ItemID': {$exists: true},
    'membermessages.MessageStatus': 'Unanswered'
  },
  
  saved: {
    'org.ItemID': {$exists: false}
  }
  
};

exports.items = function(req, res) {
  
  _items(req, function(err, result) {
    result.message = req.user.message;
    res.json({
      json: result
    });
  });
  
  console.log(req.user.email + ' ' + req.user.id);
  
} // items()

exports.item = function(req, res) {
  
  _item(req.user, req.body.id, function(err, result) {
    result.message = req.user.message;
    res.json({
      json: result
    });
  });
  
} // item()

exports.addaccount = function(req, res) {
	
  if (!req.isAuthenticated()) res.json(null);
  
  var apimodule = require('./ebayapi/GetSessionID');
	
	var reqjson = {
    email: req.user.email
  };
	
  apimodule.call(reqjson, function(err, response) {
		res.json({
			json: {
        url: config.signinurl + '?SignIn&runame=' + config.runame + '&SessID=' + response
      }
		});
  });
  
}

exports.removeaccount = function(req, res) {
	
  if (!req.isAuthenticated()) res.json(null);
	
	var userid = req.body.userid;
  
  mongo(function(db) {
    
    db.collection('items.' + req.user._id, function(err, collection) {
      collection.remove(
        {
          UserID: userid
        }
      );
    });
    
    db.collection('users', function(err, collection) {
      
      collection.update(
        {
          email: req.user.email
        },
        {
          $pull: {
            userids2: {
              username: userid
            }
          }
        }
      );
      
    });
    
    res.end();
  });
	
}

exports.import = function(req, res) {
  
  if (!req.isAuthenticated()) res.json(null);
  
  var apimodule = require('./ebayapi/GetSellerList');
  
	var reqjson = {
    email:     req.user.email,
    userid:    req.body.userid,
    daterange: req.body.daterange,
    datestart: req.body.datestart,
    dateend:   req.body.dateend
  };
  
  apimodule.call(reqjson, function(response) {
    res.end();
  });
  
}

exports.getitem = function(req, res) {
  
  if (!req.isAuthenticated()) res.json(null);
  
  var apimodule = require('./ebayapi/GetItem');
  
	var reqjson = {
    email: 'fd3s.boost@gmail.com',
    userid: 'testuser_hal',
    ItemID: req.body.ItemID
  };
  
  apimodule.call(reqjson, function(response) {
    res.end();
  });
  
}

exports.delete = function(req, res) {
  
  res.end();
  
  if (req.body.hasOwnProperty('id')) {
    
    var ids = [];
    
    if (Array.isArray(req.body.id)) {
      for (var i = 0; i < req.body.id.length; i++) {
        ids.push(ObjectID(req.body.id[i]));
      }
    } else {
      ids.push(ObjectID(req.body.id));
    }
    
    mongo(function(db) {
      db.collection('items.' + req.user._id, function(err, itemcoll) {
        
        itemcoll.remove(
          {
            _id: {
              $in: ids
            }
          }
        );
        
      });
    });
    
  }  
  
}

exports.site = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var site = query.site;
  
  mongo(function(db) {
    
    async.series({
      
      children2: function(callback) {
        var pathstr = ['0'];
        children2(site, pathstr, function(err, result) {
          callback(null, result);
        });
      },
      
      ebaydetails: function(callback) {
        db.collection(site + '.eBayDetails', function(err, coll) {
          coll.findOne({}, function(err, doc) {
            callback(null, doc);
          });
        });
      },
      
      categoryfeatures: function(callback) {
        db.collection(site + '.CategoryFeatures', function(err, coll) {
          coll.findOne({}, function(err, doc) {
            callback(null, doc);
          });
        });
      },
      
      themegroup: function(callback) {
        themegroup(site, function(err, result) {
          callback(null, result);
        });
      }
      
    }, function(err, results) {
      
      res.json({
        json: {
          Categories: results.children2.Categories,
          eBayDetails: results.ebaydetails,
          CategoryFeatures: results.categoryfeatures,
          ThemeGroup: results.themegroup,
          message: req.user.message
        }
      });
      
    });  
    
  }); // mongo
}

function categorypath(site, categoryid, callback) {
  
  mongo(function(db) {
    db.collection(site + '.Categories', function(err, coll) {
      coll.findOne(
        {
          CategoryID: categoryid.toString()
        },
        function(err, doc) {
          if (doc.CategoryLevel != '1') {
            categorypath(site, doc.CategoryParentID, function(err, result) {
              result.push(parseInt(doc.CategoryID));
              callback(null, result);
            });
          } else {
            callback(null, [parseInt(doc.CategoryID)]);
          }
        }
      ); // findOne
    }); // collection
  }); // mongo
  
}

function categorypath2(site, categoryid, callback) {
  
  mongo(function(db) {
    db.collection(site + '.Categories', function(err, coll) {
      coll.findOne(
        {
          CategoryID: categoryid.toString()
        },
        function(err, doc) {
          
          
          if (doc.CategoryLevel != '1') {
            
            categorypath2(site, doc.CategoryParentID, function(err, result) {
              result[doc.CategoryID] = doc.CategoryName;
              callback(null, result);
            });
            
          } else {
            
            var path = {};
            path[doc.CategoryID] = doc.CategoryName;
            
            callback(null, path);
          }
        }
      ); // findOne
    }); // collection
  }); // mongo
  
}

function children2(site, path, callback) {
  
  var result = {};
  var categories = {};
  
  var nextpath = clone(path);
  
  var features = {};
  
  async.series(
    [
      /* CategoryFeatures */
      function(callback) {
        console.log('children2: site: ' + site);
        mongo(function(db) {
          db.collection(site + '.CategoryFeatures', function(err, collft) {
            collft.findOne({}, function(err, doc) {
              
              features = doc.SiteDefaults;
              callback(null, null);
              
            }); // findOne
          }); // collection
        }); // mongo
      },
      
      function(callback) {
        
        /* each element in "path" argument */
        async.whilst(
          function() {
            return nextpath.length > 0;
          },
          
          function(callback) {
            var categoryid = nextpath.shift();
            
            var field = {
              CategoryID: true,
              CategoryName: true
            };
            
            var query = {};
            if (categoryid == '0') {
              query.CategoryLevel = '1';
            } else {
              query.CategoryParentID = categoryid;
            }
            
            var tmpchildren = {};
            
            mongo(function(db) {
              db.collection(site + '.Categories', function(err, coll) {
                
                coll.find(query, field).sort({_id: 1}).toArray(function(err, docs) {
                  
                  /* children of each element in "path" */
                  async.each(
                    docs,
                    function(doc, callback) {
                      
                      if (doc.CategoryID == categoryid) {
                        callback(null, null);
                        return;
                      }
                      
                      var childinfo = {};
                      childinfo.name = doc.CategoryName;
                      
                      async.parallel([
                        
                        /* children count */
                        function(callback) {
                          
                          var cursor = coll.find({
                            CategoryParentID: doc.CategoryID
                          });
                          
                          cursor.count(function(err, count) {
                            childinfo.children = count;
                            callback(null, null);
                          });
                        },
                        
                        function(callback) {
                          
                          if (doc.CategoryID == path[path.length-1]) {
                            
                            childinfo.CategoryFeatures = features;
                            
                            /* CategorySpecifics */
                            db.collection(site + '.CategorySpecifics', function(err, collspc) {
                              collspc.findOne({CategoryID: doc.CategoryID}, function(err, spcdoc) {
                                if (spcdoc != null) {
                                  childinfo.CategorySpecifics = spcdoc;
                                }
                                callback(null, null);
                              });
                            });
                          } else {
                            callback(null, null);
                          }
                        }
                        
                      ], function(err, results) {
                        
                        tmpchildren['c' + doc.CategoryID] = childinfo;
                        callback(null);
                        
                      }); // async.parallel
                      
                    },
                    function(err) {
                      
                      if (docs.length > 0) {
                        categories['c' + categoryid] = tmpchildren;
                      }
                      
                      /* CategoryFeatures */
                      mongo(function(db) {
                        db.collection(site + '.CategoryFeatures.Category', function(err, collftc) {
                          collftc.findOne({CategoryID: categoryid}, function(err, ftcdoc) {
                            
                            if (ftcdoc != null) {
                              Object.keys(ftcdoc).forEach(function(key) {
                                features[key] = ftcdoc[key];
                              });
                            }
                            
                            //callback(null, categoryid);
                            callback(null, null);
                          });
                        });
                      });
                      
                    }
                  ); // async.each
                  
                }); // find
              }); // collection
            }); // mongo
            
          },
          
          function(err) {
            result.Categories = categories;
            
            callback(null, null);
          }
        ); // async.whilst
        
      }
    ],
    function(err, results) {
      callback(null, result);
    }
  ); // async.series
  
  return;
}; // children2()

exports.gc2 = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  var site = query.site;
  var path = query.path.split('.');
  
  children2(site, path, function(err, result) {
    res.json({
      json: {
        gc2: result,
        message: req.user.message
      }
    });
  });
  
} // gc2()

exports.dismissmessage = function(req, res) {
  
  updatemessage(req.user.email, false, '');
  
  res.json({
    json: {
      message: null
    }
  });
  
} // dismissmessage()

exports.summary = function(req, res) {
  
  summarydata(req.user, function(err, result) {
    res.json({
      json: {
        summary: result,
        message: req.user.message
      }
    });
  });
  
} // summary()

exports.summary_backbone = function(req, res) {
  
  summarydata(req.user, function(err, result) {
    
    var data = [];
    
    Object.keys(result).forEach(function(key) {
      
      var tmp = result[key];
      tmp.userid = key;
      
      data.push(tmp);
    });
    
    res.json(data);
  });
  
} // summary_backbone()

exports.refresh = function(req, res) {
  
  _items(req, function(err, result_items) {
    summarydata(req.user, function(err, result_summary) {
      
      result_items.summary = result_summary;
      result_items.message = req.user.message;
      
      res.json({
        json: result_items
      });
    });
  });

} // refresh()

exports.copy = function(req, res) {
  
  /* query */
  var query = {};
  
  if (req.body.hasOwnProperty('id')) {
    
    var ids = [];
    
    if (Array.isArray(req.body.id)) {
      for (var i = 0; i < req.body.id.length; i++) {
        ids.push(ObjectID(req.body.id[i]));
      }
    } else {
      ids.push(ObjectID(req.body.id));
    }
    query._id = {
      $in: ids
    }
    
  } else {
    
    query = clone(sellingquery[req.body.selling]);
    if (req.body.UserID != '') {
      query['UserID'] = req.body.UserID;
    }
    if (req.body.Title != '') {
      query['mod.Title'] = new RegExp(req.body.Title, 'i');
    }
    if (req.body['mod.ListingType'] != '') {
      query['mod.ListingType'] = req.body['mod.ListingType'];
    }
    
  }
  
  var field = {
    _id: 0,
    org: 0,
    log: 0,
    membermessages: 0
  };
  
  var newdblist = [];
  
  mongo(function(db) {
    db.collection('items.' + req.user._id, function(err, itemcoll) {
      
      // todo: need snapshot mode?
      itemcoll.find(query, field).toArray(function(err, items) {
        
        items.forEach(function(item) {
          newdblist.push(clone(item));
        }); // items.forEach
        
        itemcoll.insert(newdblist);
        
        res.json({
          json: {
            message: null
          }
        });
        
      }); // itemcoll.find
    }); // collection
  }); // mongo
  
} // copy()

exports.settings = function(req, res) {
  
  if (req.body.hasOwnProperty('timezone')) {
    
    mongo(function(db) {
      db.collection('users', function(err, coll) {
        coll.update(
          {
            email: req.user.email
          },
          {
            $set: {
              timezone: req.body.timezone
            }
          }
        ); // update
      }); // collection
    }); // mongo
    
    req.user.timezone = req.body.timezone;
  }
  
  var settings = {};
  settings.language   = req.user.language;
  settings.timezone   = req.user.timezone;
  settings.expiration = req.user.expiration;
  settings.itemlimit  = req.user.itemlimit;
  settings.status     = req.user.status;
  settings.email      = req.user.email;
  
  var userids2 = [];
  if (req.user.hasOwnProperty('userids2')) {
    req.user.userids2.forEach(function(userid) {
      var tmp = clone(userid);
      delete tmp['@xmlns'];
      delete tmp.Ack;
      delete tmp.CorrelationID;
      delete tmp.Version;
      delete tmp.Build;
      delete tmp.eBayAuthToken;
      
      userids2.push(tmp);
    });
  }
  settings.userids2 = userids2;
  
  res.json({
    json: {
      settings: settings,
      message: req.user.message
    }
  });
  
} // settings()

exports.end = function(req, res) {
  
  if (req.body.hasOwnProperty('id')) {
    
    var ids = [];
    
    if (Array.isArray(req.body.id)) {
      for (var i = 0; i < req.body.id.length; i++) {
        ids.push(ObjectID(req.body.id[i]));
      }
    } else {
      ids.push(ObjectID(req.body.id));
    }
    
    var taskid = 'end_' + moment().format('YYYY-MM-DD_HH-mm-ss');
    
    var query = {
      _id: {
        $in: ids
      }
    };
    
    var update = {
      $set: {
        status: taskid
      }
    };
    
    mongo(function(db) {
      db.collection('items.' + req.user._id, function(err, itemcoll) {
        
        itemcoll.find(query).count(function(err, count) {
          
          updatemessage(req.user.email, true, 'Ending ' + count + ' items.');
          
          res.json({
            json: {
              message: {
                datetime: now,
                hasnext: true,
                message: 'Ending ' + count + ' items.'
              }
            }
          });
          
          itemcoll.update(query, update, {multi: true});
          
          var args = ['EndItems', req.user.email, taskid];
          writesocket_async(args);
        });
        
      }); // collection
    }); // mongo
    
  } // if (req.body.hasOwnProperty('id'))
  
} // end()

exports.relist = function(req, res) {
  
  if (req.body.hasOwnProperty('id')) {
    
    var ids = [];
    
    if (Array.isArray(req.body.id)) {
      for (var i = 0; i < req.body.id.length; i++) {
        ids.push(ObjectID(req.body.id[i]));
      }
    } else {
      ids.push(ObjectID(req.body.id));
    }
    
    var taskid = 'relist_' + moment().format('YYYY-MM-DD_HH-mm-ss');
    
    var query = {
      _id: {
        $in: ids
      }
    };
    
    var update = {
      $set: {
        status: taskid
      }
    };
    
    mongo(function(db) {
      db.collection('items.' + req.user._id, function(err, itemcoll) {
        
        itemcoll.find(query).count(function(err, count) {
          
          updatemessage(req.user.email, true, 'Relisting ' + count + ' items.');
          
          res.json({
            json: {
              message: {
                datetime: now,
                hasnext: true,
                message: 'Relisting ' + count + ' items.'
              }
            }
          });
          
          itemcoll.update(query, update, {multi: true});
          
          var args = ['RelistItem', req.user.email, taskid];
          writesocket_async(args);
          
        });
        
      }); // collection
    }); // mongo
    
  } // if (req.body.hasOwnProperty('id'))
  
} // relist()

exports.revise = function(req, res) {
  
  if (req.body.hasOwnProperty('id')) {
    
    var ids = [];
    
    if (Array.isArray(req.body.id)) {
      for (var i = 0; i < req.body.id.length; i++) {
        ids.push(ObjectID(req.body.id[i]));
      }
    } else {
      ids.push(ObjectID(req.body.id));
    }
    
    var taskid = 'revise_' + moment().format('YYYY-MM-DD_HH-mm-ss');
    
    var query = {
      _id: {
        $in: ids
      }
    };
    
    var update = {
      $set: {
        status: taskid
      }
    };
    
    mongo(function(db) {
      db.collection('items.' + req.user._id, function(err, itemcoll) {
        
        itemcoll.find(query).count(function(err, count) {
          
          updatemessage(req.user.email, true, 'Revising ' + count + ' items.');
          
          res.json({
            json: {
              message: {
                datetime: now,
                hasnext: true,
                message: 'Revising ' + count + ' items.'
              }
            }
          });
          
          itemcoll.update(query, update, {multi: true});
          
          var args = ['ReviseItem', req.user.email, taskid];
          writesocket_async(args);
          
        });
        
      }); // collection
    }); // mongo
    
  } // if (req.body.hasOwnProperty('id'))
  
} // revise()

exports.verifyadditem = function(req, res) {
  
  if (req.body.hasOwnProperty('id')) {
    
    var ids = [];
    
    if (Array.isArray(req.body.id)) {
      for (var i = 0; i < req.body.id.length; i++) {
        ids.push(ObjectID(req.body.id[i]));
      }
    } else {
      ids.push(ObjectID(req.body.id));
    }
    
    var taskid = 'verify_' + moment().format('YYYY-MM-DD_HH-mm-ss');
    
    var query = {
      _id: {
        $in: ids
      }
    };
    
    var update = {
      $set: {
        status: taskid
      }
    };
    
    mongo(function(db) {
      db.collection('items.' + req.user._id, function(err, itemcoll) {
        
        itemcoll.find(query).count(function(err, count) {
          
          updatemessage(req.user.email, true, 'Verifing ' + count + ' items.');
          
          res.json({
            json: {
              message: {
                datetime: now,
                hasnext: true,
                message: 'Verifing ' + count + ' items.'
              }
            }
          });
          
          itemcoll.update(query, update, {multi: true});
          
          var args = ['VerifyAddItem', req.user.email, taskid];
          writesocket_async(args);
          
        });
        
      }); // collection
    }); // mongo
    
  } // if (req.body.hasOwnProperty('id'))
  
} // verifyadditem()

exports.add = function(req, res) {
  
  if (req.body.hasOwnProperty('id')) {
    
    var ids = [];
    
    if (Array.isArray(req.body.id)) {
      for (var i = 0; i < req.body.id.length; i++) {
        ids.push(ObjectID(req.body.id[i]));
      }
    } else {
      ids.push(ObjectID(req.body.id));
    }
    
    var taskid = 'add_' + moment().format('YYYY-MM-DD_HH-mm-ss');
    
    var query = {
      _id: {
        $in: ids
      }
    };
    
    var update = {
      $set: {
        status: taskid
      }
    };
    
    mongo(function(db) {
      db.collection('items.' + req.user._id, function(err, itemcoll) {
        
        itemcoll.find(query).count(function(err, count) {
          
          updatemessage(req.user.email, true, 'Listing ' + count + ' items.');
          
          res.json({
            json: {
              message: {
                datetime: now,
                hasnext: true,
                message: 'Listing ' + count + ' items.'
              }
            }
          });
          
          itemcoll.update(query, update, {multi: true});
          
          var args = ['AddItems', req.user.email, taskid];
          writesocket_async(args);
          
        });
        
      }); // collection
    }); // mongo
    
  } // if (req.body.hasOwnProperty('id'))
  
} // add

exports.import_java = function(req, res) {
  
  /* GetSellerList */
  var args = [
    'GetSellerList',
    req.user.email,
    req.body.userid,
    req.body.daterange,
    req.body.datestart,
    req.body.dateend,
    'ReturnAll'
  ];
  
  writesocket_async(args);
  
  /* GetMemberMessages */
  args = [
    'GetMemberMessages',
    req.user.email,
    req.body.userid,
    req.body.datestart + 'T00:00:00.000Z',
    req.body.dateend + 'T00:00:00.000Z'
  ];
  
  writesocket_async(args);
  
  res.json({
    json: {
      message: req.user.message
    }
  });
  
} // import()

exports.descriptiontemplate = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  _descriptiontemplate(query.site, query.groupid, function(err, dtres) {
    res.json({
      json: dtres
    });
  });
  
} // descriptiontemplate

exports.signup = function(req, res) {
  
  if (!req.body.hasOwnProperty('email')
      || !req.body.hasOwnProperty('password')
      || !req.body.hasOwnProperty('password2')) {
    
    res.json({
      json: {
        resultmessage: 'Please fill forms.',
        result: false
      }
    });
    
    return;
  }  
  
  if (req.body.email == '' || req.body.password == '' || req.body.password2 == '') {
    res.json({
      json: {
        resultmessage: 'Please fill forms.',
        result: false
      }
    });
    
    return;
  } 
  
  if (req.body.password != req.body.password2) {
    
    res.json({
      json: {
        resultmessage: 'Password mismatch.',
        result: false
      }
    });
    
    return;
  }
  
  /* check existing user */
  mongo(function(db) {
    db.collection('users', function(err, coll) {
      coll.findOne({email: req.body.email}, function(err, user) {
        
        if (user != null) {
          
          res.json({
            json: {
              resultmessage: 'Sorry, this email already exists.',
              result: false
            }
          });
          
        } else {
          
          // todo: password encryption
          crypto.randomBytes(20, function(err, buf) {
            
            var tmptoken = buf.toString('hex');
            //console.log('random: ' + tmptoken);
            
            var tmptoken_expiration = '';
            
            var field = {
              email: req.body.email,
              password: req.body.password,
              tmptoken: tmptoken,
              tmptoken_expiration: tmptoken_expiration,
              status: 'temporary registration',
              language: 'English',
              timezone: 'GMT-08:00',
              itemlimit: '100',
              newlook: 1,
              created_at: now,
              lastused_at: now
            };
            
            coll.insert(field);
            
            res.json({
              json: {
                resultmessage: req.body.email,
                result: true
              }
            });
            
            var emaildata = {
              tmptoken: tmptoken
            };
            
            send_signup_confirm_mail(req.body.email, emaildata);
            
          }); // randomBytes
          
        }
        
      }); // findOne
    }); // collection
  }); // mongo
  
} // signup

exports.forgotpassword = function(req, res) {
  
  /* check existing user */
  mongo(function(db) {
    db.collection('users', function(err, coll) {
      coll.findOne({email: req.body.fpemail}, function(err, user) {
        
        if (user == null) {
          
          res.json({
            json: {
              message: 'The email address is not registered.',
              result: false
            }
          });
          
        } else {
          
          // todo: password encryption
          crypto.randomBytes(20, function(err, buf) {
            
            var tmptoken = buf.toString('hex');
            var tmptoken_expiration = '';
            
            coll.update(
              {
                email: req.body.fpemail
              },
              {
                $set : {
                  tmptoken: tmptoken
                }
              }
            );
            
            res.json({
              json: {
                message: req.body.fpemail,
                result: true
              }
            });
            
            var emaildata = {
              tmptoken: tmptoken
            };
            
            sendmail('Password reset for ListersIn',
                     'forgotpassword',
                     req.body.fpemail, 
                     emaildata);
            
          }); // randomBytes
          
        }
        
      }); // findOne
    }); // collection
  }); // mongo
  
} // forgotpassword

exports.resetpassword = function(req, res) {
  
  if (!req.body.hasOwnProperty('email')
      || !req.body.hasOwnProperty('password')
      || !req.body.hasOwnProperty('password2')) {
    
    res.json({
      json: {
        resultmessage: 'Please fill forms.',
        result: false
      }
    });
    
    return;
  }  
  
  if (req.body.email == '' || req.body.password == '' || req.body.password2 == '') {
    res.json({
      json: {
        resultmessage: 'Please fill forms.',
        result: false
      }
    });
    
    return;
  } 
  
  if (req.body.password != req.body.password2) {
    
    res.json({
      json: {
        resultmessage: 'Password mismatch.',
        result: false
      }
    });
    
    return;
  }
  
  var query = {
    email: req.body.email
  };
  
  mongo(function(db) {
    db.collection('users', function(err, coll) {
      coll.findOne(query, function(err, user) {
        
        if (user != null) {
          coll.update(
            query,
            {
              $set: {
                password: req.body.password,
                tmptoken: ''
              }
            },
            function(err, result) {
              res.json({
                json: {
                  result: true
                }
              });
            }
          );
        }
        
      }); // findOne
    }); // collection
  }); // mongo
  
} // resetpassword

exports.save = function(req, res) {
  
  var id   = req.body.id;
  var form = req.body.json;
  
  var item = JSON.parse(form);
  var mod  = item.mod;
  var opt  = item.opt;
  var setting = item.setting;
  var shippingdetails = item.ShippingDetails;
  
  /* ScheduleTime */
  if (mod.hasOwnProperty('ScheduleTime')) {
    
    var scheduletimestr = mod.ScheduleTime;
    
    var zonestr = req.user.timezone.replace(/^GMT/, '');
    
    var scheduletime = moment(scheduletimestr + zonestr);
    
    console.log(scheduletimestr);
    console.dir(scheduletime);
    
    if (opt.ScheduleType == 'ebay') {
      mod.ScheduleTime = scheduletime._d;
      delete opt.ScheduleTime;
    } else if (opt.ScheduleType == 'listersin') {
      delete mod.ScheduleTime;
      opt.ScheduleTime = scheduletime._d;
    } else {
      delete mod.ScheduleTime;
      delete opt.ScheduleTime;
      delete opt.ScheduleType;
    }
    
  } else {
    delete mod.ScheduleTime;
    delete opt.ScheduleTime;
    delete opt.ScheduleType;
  } // mod.hasOwnProperty('ScheduleTime')
  
  /* int */
  for (var i=0; i<config.intfield.length; i++) {
    convertint(mod, config.intfield[i]);
  }
  
  /* double */
  for (var i=0; i<config.doublefield.length; i++) {
    convertdouble(mod, config.doublefield[i]);
  }
  
  /* date */
  for (var i=0; i<config.datefield.length; i++) {
    convertdate(mod, config.datefield[i]);
  }
  
  var orgexists = false;
  var taskid = 'verifyadditem_' + moment().format('YYYY-MM-DD_HH-mm-ss');
  
  mongo(function(db) {
    db.collection('items.' + req.user._id, function(err, coll) {
      
      async.series([
        
        /* Save sorted json before update */
        function(callback) {
          
          if (id == 'newitem0') {
            callback(null, null);
            return;
          }
          
          coll.findOne({
            _id: ObjectID(id)
          }, function(err, before) {
            
            if (before.hasOwnProperty('org')) {
              orgexists = true;
            }
            
            var diffdir = '/var/www/' + config.hostname + '/logs/diff'
              + '/' + moment(new Date()).format('YYYY-MM-DD');
            
            if (!fs.existsSync(diffdir)) fs.mkdirSync(diffdir);
            
            fs.writeFile(diffdir + '/' + item.UserID + '.' + id + '.0.before.js',
                         JSON.stringify(sortObject(before), null, 2));
            
            callback(null, null);
          });
        },
        
        /* Save posted item data */
        function(callback) {
          
          if (id == 'newitem0') {
            
            /* save new item */
            var newid = ObjectID();
            id = newid.toString();
            
            var newitem = {
              _id: newid,
              mod: mod,
              opt: opt,
              UserID: item.UserID,
            };
            if (req.user.email != 'demo@listers.in') {
              newitem.status = taskid;
            }
            
            coll.insert(newitem, callback);
            
          } else {
            
            /* update existing item */
            var set = {
              mod: mod,
              opt: opt,
              UserID: item.UserID
            }
            if (!orgexists) {
              set.status = taskid;
            } else {
              set.status = taskid;
            }
            
            coll.update({_id: ObjectID(id)}, {$set: set}, {safe: true}, callback);
          }
        },
        
        /* Save sorted json after update */
        function(callback) {
          
          coll.findOne({
            _id: ObjectID(id)
          }, function(err, after) {
            
            var diffdir = '/var/www/' + config.hostname + '/logs/diff'
              + '/' + moment(new Date()).format('YYYY-MM-DD');
            
            if (!fs.existsSync(diffdir)) fs.mkdirSync(diffdir);
            
            fs.writeFile(diffdir + '/' + item.UserID + '.' + id + '.1.after.js',
                         JSON.stringify(sortObject(after), null, 2));
            
            callback(null, null);
          });
        },
        
        /* VerifyAddItem */
        function(callback) {
          
          if (req.user.email == 'demo@listers.in') {
            callback(null, null);
            return;
          }
          if (orgexists) {
            callback(null, null);
            return;
          }
          
          /* VerifyAddItem */
          var args = ['VerifyAddItem', req.user.email, taskid];
          writesocket(args, function() {
            console.log('verify callback');
            callback(null, null);
          });
        }
        
      ], function(err, results) {
        
        _item(req.user, id, function(err, result) {
          result.message = req.user.message;
          res.json({
            json: result
          });
        });
        
      }); // async.series
      
    }); // collection
  }); // mongo
  
} // exports.save

exports.save_backbone = function(req, res) {
  
  var id   = req.body.id;
  var form = req.body.json;
  
  var item = JSON.parse(form);
  var mod  = item.mod;
  var opt  = item.opt;
  var setting = item.setting;
  var shippingdetails = item.ShippingDetails;
  
  //req.body.id = req.params.id;
  //var obj = extractObject(req.body.form);
  
  //console.log('save: ' + req.params.id);
  
  //req.body.id = req.params.id;
  
  _items(req, function(err, result) {
    result.message = req.user.message;
    res.json({
      json: result
    });
  });
}

exports.orders = function(req, res) {
  
} // exports.orders

exports.addmembermessagertq = function(req, res) {
  
  /* AddMemberMessageRTQ */
  var args = [
    'AddMemberMessageRTQ',
    req.user.email,
    req.body.userid,
    req.body.itemid,
    req.body.parent,
    req.body.body.replace(/\n/g, "\\n")
  ];
  
  writesocket(args, function(err, result) {
    
    /* GetMemberMessage */
    args = [
      'GetMemberMessages',
      req.user.email,
      req.body.userid,
      req.body.itemid
    ];
    
    writesocket(args, function(err, result) {
      res.json({
        json: {
          result: result
        }
      });
    });
    
  }); // writesocket
  
} // addmembermessagertq

exports.findproducts = function(req, res) {
  
  async.parallel({
    
    categories: function(callback) {
      
      var apimodule = require('./ebayapi/GetSuggestedCategories');
      
	    var reqjson = {
        email:   req.user.email,
        userid:  req.body.userid,
        site:    req.body.site,
        keyword: req.body.keyword
      };
      
      apimodule.call(reqjson, callback);
      
    }, // categories
    
    products: function(callback) {
      
      var apimodule = require('./ebayapi/FindProducts');
      
	    var reqjson = {
        email:    req.user.email,
        userid:   req.body.userid,
        site:     req.body.site,
        findtype: req.body.findtype,
        keyword:  req.body.keyword
      };
      
      apimodule.call(reqjson, callback);
      
    } // products
    
  }, function(err, results) {
    
		res.json({
			json: {
        categories: results.categories,
        result:     results.products,
        message:    req.user.message
      }
		});
    
  }); // async.parallel
  
} // findproducts

exports.savedebugjson = function(req, res) {
  
  var org = JSON.parse(req.body.json);
  
  var sorted = sortObject(org.json);
  
  var filename = '/var/www/' + config.hostname + '/logs/diff/';
  filename += req.user.email.replace(/@.+$/, '') + '.' + req.body.filename + '.json';
  
  fs.writeFile(filename, JSON.stringify(sorted, null, 2));
  
  res.json({
    json: {
      message: null
    }
  });
  
}; // savedebugjson

function _descriptiontemplate(site, groupid, callback) {
  
  var lhm = {};
  
  mongo(function(db) {
    db.collection(site + '.DescriptionTemplates.DescriptionTemplate', function(err, colldt) {
      colldt.find({GroupID: groupid}).toArray(function(err, docs) {
        
        docs.forEach(function(doc) {
          lhm[doc._id] = doc;
        });
        
        callback(null, lhm);
      });
    }); // collection
  }); // mongo
  
}

function sortObject(o) {
  
  var sorted = {};
  var key;
  var a = [];
  
  for (key in o) {
    if (o.hasOwnProperty(key)) {
      a.push(key);
    }
  }
  a.sort();
  
  for (key = 0; key < a.length; key++) {
    if (a[key] == '_id') continue;
    
    if (util.isArray(o[a[key]])) {
        sorted[a[key]] = [];
        
        if (typeof(o[a[key]][0]) == 'object') {
          for (var i = 0; i < o[a[key]].length; i++) {
            sorted[a[key]][i] = sortObject(o[a[key]][i]);
          }
        } else {
          sorted[a[key]] = o[a[key]].sort();
        }
        
    } else if (typeof(o[a[key]]) == 'object') {
      sorted[a[key]] = sortObject(o[a[key]]);
    } else {
      sorted[a[key]] = o[a[key]];
    }
  }
  
  return sorted;
}

function mapcategoryid(site, categoryid, callback) {
  
  mongo(function(db) {
    db.collection(site + '.CategoryMappings', function(err, coll) {
      coll.findOne({'@oldID': categoryid}, function(err, doc) {
        
        if (doc != null) {
          console.log('mapcategoryid: ' + categoryid + ' -> ' + doc['@id']);
          callback(null, doc['@id']);
        } else {
          console.log('mapcategoryid: ' + categoryid + ' no map');
          callback(null, categoryid);
        }
        
      }); // findOne
    }); // collection
  }); // mongo
  
}

function themegroup(site, callback) {
  
  var rows = {};
  
  mongo(function(db) {
    db.collection(site + '.DescriptionTemplates.ThemeGroup', function(err, coll) {
      coll.find({}).toArray(function(err, docs) {
        
        docs.forEach(function(doc) {
          rows[doc._id] = doc;
        });
        
        callback(null, rows);
        
      }); // find
    }); // collection
  }); // mongo
  
} // themegroup()

function summarydata(user, callback) {
  
  var summarydata = {};
  
  if (!user.hasOwnProperty('userids2')) {
    callback(null, summarydata);
    return;
  }
  
  var allsummary = {};
  
  mongo(function(db) {
    db.collection('items.' + user._id, function(err, itemcoll) {
      
      var userids = ['alluserids'];
      user.userids2.forEach(function(userid) {
        userids.push(userid.username);
      });
      
      async.whilst(
        function() {
          return userids.length > 0;
        },
        
        function(callback) {
          var userid = userids.shift();
          summarydata[userid] = {};
          
          var sellingquerykeys = [];
          Object.keys(sellingquery).forEach(function(key) {
            sellingquerykeys.push(key);
          });
          
          async.whilst(
            function() {
              return sellingquerykeys.length > 0;
            },
            function(callback) {
              var sellingquerykey = sellingquerykeys.shift();
              
              var query = clone(sellingquery[sellingquerykey]);
              query.UserID = {
                $in: userids
              }
              if (userid != 'alluserids') {
                query.UserID = userid;
              }
              
              itemcoll.count(query, function(err, result) {
                summarydata[userid][sellingquerykey] = result;
                callback(null, null);
              });
            },
            function(err) {
              callback(null, null);
            }
          );
        },
        
        function(err) {
          callback(null, summarydata);
        }
      ); // async.whilst
      
    }); // collection
  }); // mongo
  
} // summary()

function _items(req, callback) {
  
  var zonestr = req.user.timezone.replace(/^GMT/, '');
  
  var limit  = 40;
  var offset = 0;
  if (req.body.hasOwnProperty('limit'))  limit  = parseInt(req.body.limit);
  if (req.body.hasOwnProperty('offset')) offset = parseInt(req.body.offset);
  
  /* query */
  var query = {};
  
  if (req.body.hasOwnProperty('id')) {
    
    var ids = [];
    
    if (Array.isArray(req.body.id)) {
      for (var i = 0; i < req.body.id.length; i++) {
        ids.push(ObjectID(req.body.id[i]));
      }
    } else {
      ids.push(ObjectID(req.body.id));
    }
    query._id = {
      $in: ids
    }
    
  } else {
    
    query = clone(sellingquery[req.body.selling]);
    if (req.body.hasOwnProperty('UserID') && req.body.UserID != '') {
      query['UserID'] = req.body.UserID;
    }
    if (req.body.hasOwnProperty('Title') && req.body.Title != '') {
      query['mod.Title'] = new RegExp(req.body.Title, 'i');
    }
    if (req.body.hasOwnProperty('mod.ListingType') && req.body['mod.ListingType'] != '') {
      query['mod.ListingType'] = req.body['mod.ListingType'];
    }
    
  }
  
  /* field */
  var field = {
    'error' : 1,
    'membermessages' : 1,
    'message' : 1,
    'opt' : 1,
    'status' : 1,
    'UserID' : 1,
    
    'mod.ListingType' : 1,
    'mod.PictureDetails.GalleryURL' : 1,
    'mod.PictureDetails.PictureURL' : 1,
    'mod.Quantity' : 1,
    'mod.ScheduleTime' : 1,
    'mod.Site' : 1,
    'mod.StartPrice' : 1,
    'mod.Title' : 1,
    
    'org.HitCount' : 1,
    'org.ItemID' : 1,
    'org.ListingDetails.EndTime' : 1,
    'org.ListingDetails.HasUnansweredQuestions' : 1,
    'org.ListingDetails.StartTime' : 1,
    'org.ListingDetails.ViewItemURL' : 1,
    'org.Seller.UserID' : 1,
    'org.SellingStatus.BidCount' : 1,
    'org.SellingStatus.CurrentPrice' : 1,
    'org.SellingStatus.ListingStatus' : 1,
    'org.SellingStatus.QuantitySold' : 1,
    'org.TimeLeft' : 1,
    'org.WatchCount' : 1
  };
  
  if (req.body.hasOwnProperty('bulk')) {
    field = null;
  }
  
  /* sort */
  var sort = {};
  if (req.body.hasOwnProperty('sortfield')) {
    sort[req.body.sortfield] = parseInt(req.body.sortorder);
    sort._id = -1;
  }
  
  var paths = {};
  var bulksites = {};
  
  /* each items */
  mongo(function(db) {
    db.collection('items.' + req.user._id, function(err, itemcoll) {
      
      var cursor = itemcoll.find(query, field).limit(limit).skip(offset).sort(sort);
      cursor.count(function(err, count) {
        cursor.toArray(function(err, items) {
          items.forEach(function(item) {
            
            if (!item.hasOwnProperty('mod')) return;
            
            var mod = item.mod;
            
            var tmp = {};
            
            item.id = item._id;
            
            var id = item._id;
            var site = mod.Site;
            
            /* StartPrice */
            if (mod.hasOwnProperty('StartPrice')) {
              var sp = mod.StartPrice;
              if (sp.hasOwnProperty('@currencyID')) {
                item.price = sp['@currencyID'] + ' ' + sp['#text'];
              } else if (sp.hasOwnProperty('#text')) {
                item.price = sp['#text'];
              } else {
                item.price = '(error)';
              }
            }
            
            /* scheduled time */
            if (item.hasOwnProperty('setting')) {
              if (item.setting.hasOwnProperty('schedule')) {
                
                var schedule = item.setting.schedule;
                
              }
            }
            
            /* ScheduleTime */
            if (mod.hasOwnProperty('ScheduleTime')) {
              
              /* Scheduled on eBay but not submitted yet */
              tmp.ScheduleTime = mod.ScheduleTime;
              
            } else if (item.hasOwnProperty('org')) {
              
              var org = item.org;
              var listingdetails = org.ListingDetails;
              
              /* StartTime */
              if (listingdetails.hasOwnProperty('StartTime')) {
                
                
                
              } // StartTime
              
              /* EndTime */
              if (item.org.ListingDetails.hasOwnProperty('EndTime')) {
                item.endtime = moment(item.org.ListingDetails.EndTime)
                  .zone(zonestr)
                  .format('MMM D HH:mm');
              }
              
              /* CurrentPrice */
              var sellingstatus = org.SellingStatus;
              var currentprice = sellingstatus.CurrentPrice;
              item.currentprice = currentprice['@currencyID'] + ' ' + currentprice['#text'];
              
              if (req.body.hasOwnProperty('bulk')) {
                if (mod.hasOwnProperty('PrimaryCategory')) {
                  var categoryid = mod.PrimaryCategory.CategoryID;
                  
                }
              }
              
            } // org
            
            /* adjust timezone of membermessages */
            if (item.hasOwnProperty('membermessages')) {
              for (var idx = 0; idx < item.membermessages.length; idx++) {
                var membermessage = item.membermessages[idx];
                membermessage.CreationDate = 
                  moment(membermessage.CreationDate).zone(zonestr).format('MMM D HH:mm');
              }
            }
            
            /* missing fields */
            if (false) {
            }
            
          }); // forEach
          
          callback(null, {
            items: items,
            cnt: count
          });
          
        }); // toArray
      }); // count
    }); // collection
  }); // mongo
  
} // _items()

function _item(user, id, callback) {
  
  var zonestr = user.timezone.replace(/^GMT/, '');
  
  var json = {};
  var item = {};
  
  /*
  var mod  = {};
  var org  = {};
  var opt  = {};
  */
  
  /* query */
  var query = {
    _id: ObjectID(id)
  };
  
  async.series([
    
    function(callback) {
      mongo(function(db) {
        db.collection('items.' + user._id, function(err, itemcoll) {
          itemcoll.findOne(query, function(err, doc) {
            
            item = doc;
            item.id = item._id;
            
            /*
            if (!item.hasOwnProperty('org')) item.org = {};
            if (!item.hasOwnProperty('opt')) item.opt = {};
            org = item.org;
            opt = item.opt;
            */
            
            callback(null, 'item');
          });
        }); // collection
      }); // mongo
    },
    
    /* PrimaryCategory */
    function(callback) {
      if (item.mod.hasOwnProperty('PrimaryCategory')) {
        mapcategoryid(item.mod.Site, item.mod.PrimaryCategory.CategoryID, 
                      function(err, categoryid) {
                        item.mod.PrimaryCategory.CategoryID = categoryid;
                        callback(null, 'PrimaryCategory');
                      });
      } else {
        callback(null, 'PrimaryCategory');
      }
    },
    
    /* SecondaryCategory */
    function(callback) {
      if (item.mod.hasOwnProperty('SecondaryCategory')) {
        mapcategoryid(item.mod.Site, item.mod.SecondaryCategory.CategoryID, 
                      function(err, categoryid) {
                        item.mod.SecondaryCategory.CategoryID = categoryid;
                        callback(null, 'SecondaryCategory');
                      });
      } else {
        callback(null, 'SecondaryCategory');
      }
    },
    
    function(callback) {
      
      if (item.mod.hasOwnProperty('PrimaryCategory')) {
        
        /* categorypath */
        // todo: update old categoryid to current active categoryid
        categorypath(item.mod.Site, item.mod.PrimaryCategory.CategoryID, function(err, path) {
          
          console.dir(path);
          item.categorypath = path;
          
          /* grandchildren */
          var pathstr = clone(path);
          pathstr.unshift('0');
          for (var i = 0; i < path.length; i++) {
            pathstr[i+1] = path[i].toString();
          }
          
          children2(item.mod.Site, pathstr, function(err, children2result) {
            
            json.Categories = children2result.Categories;
            
            categorypath2(item.mod.Site, item.mod.PrimaryCategory.CategoryID, function(err, path2) {
              
              item.categorypath2 = path2;
              
              callback(null, 'PrimaryCategory-path');
            });
          });
          
        });
        
      } else {
        
        /* grandchildren */
        var pathstr = ['0'];
        children2(item.mod.Site, pathstr, function(err, children2result) {
          json.Categories = children2result.Categories;
          callback(null, 'PrimaryCategory-0');
        });
      }
    },
    
    function(callback) {
      
      if (item.mod.hasOwnProperty('SecondaryCategory')) {
        
        /* categorypath */
        // todo: update old categoryid to current active categoryid
        categorypath(item.mod.Site, item.mod.SecondaryCategory.CategoryID, function(err, path) {
          
          console.dir(path);
          item.categorypath = path;
          
          /* grandchildren */
          var pathstr = clone(path);
          pathstr.unshift('0');
          for (var i = 0; i < path.length; i++) {
            pathstr[i+1] = path[i].toString();
          }
          
          children2(item.mod.Site, pathstr, function(err, children2result) {
            json.SecondaryCategories = children2result.Categories;
            callback(null, 'SecondaryCategory-path');
          });
        });
        
      } else {
        
        /* grandchildren */
        var pathstr = ['0'];
        children2(item.mod.Site, pathstr, function(err, children2result) {
          json.SecondaryCategories = children2result.Categories;
          callback(null, 'SecondaryCategory-0');
        });
      }
    },
    
    function(callback) {
      
      /* ListingDesigner */
      json.DescriptionTemplate = '';
      if (item.mod.hasOwnProperty('ListingDesigner')) {
        if (item.mod.ListingDesigner.hasOwnProperty("ThemeID")) {
          
          var themeid = item.mod.ListingDesigner.ThemeID.toString();
          var colldtname = item.mod.Site + '.DescriptionTemplates.DescriptionTemplate';
          
          mongo(function(db) {
            db.collection(colldtname, function(err, colldt) {
              colldt.findOne({ID: themeid}, function(err, doc) {
                
                if (doc == null) {
                  callback(null, 'ListingDesigner');
                  return;
                }
                
                item.ListingDesigner = {
                  GroupID: doc.GroupID
                }
                
                _descriptiontemplate(item.mod.Site, doc.GroupID, function(err, dtres) {
                  json.DescriptionTemplate = dtres;
                  callback(null, 'ListingDesigner');
                  return;
                });
                
              }); // findOne
            }); // collection
          }); // mongo
        } else {
          callback(null, 'ListingDesigner');
        }
      } else {
        callback(null, 'ListingDesigner');
      }
    },
    
    /* ScheduleTime */
    function(callback) {
      
      if (item.mod.hasOwnProperty('ScheduleTime')) {
        
        /* Scheduled on eBay but not submitted yet */
        item.mod.ScheduleTime = 
          moment(item.mod.ScheduleTime).zone(zonestr).format('YYYY-MM-DD HH:mm');
        
      } else if (item.hasOwnProperty('org') && item.org.hasOwnProperty('ListingDetails')) {
        
        /* Imported scheduled item from ebay */
        var listingdetails = item.org.ListingDetails;
        
        if (listingdetails.hasOwnProperty('StartTime')) {
          var starttime = moment(listingdetails.StartTime);
          var now = moment();
          if (starttime.isAfter(now)) {
            item.mod.ScheduleTime = starttime.zone(zonestr).format('YYYY-MM-DD HH:mm');
            item.opt.ScheduleType = 'ebay';
          }
        }
        
      } else if (item.hasOwnProperty('opt') && item.opt.hasOwnProperty('ScheduleTime')) {
        
        /* Scheduled on ListersIn */
        item.mod.ScheduleTime = 
          moment(item.opt.ScheduleTime).zone(zonestr).format('YYYY-MM-DD HH:mm');
        
      }
      
      callback(null, 'ScheduleTime');
    },
    
    /* Misc */
    function(callback) {
      
      if (item.hasOwnProperty('opt') && !item.opt.hasOwnProperty('AutoRelist')) {
        item.opt = {
          AutoRelist: false
        };
      }
      
      callback(null, 'Misc');
    },
    
    /* eBayDetails */
    function(callback) {
      mongo(function(db) {
        db.collection(item.mod.Site + '.eBayDetails', function(err, coll) {
          coll.findOne({}, function(err, document) {
            console.log('eBayDetails site:' + item.mod.Site);
            json.eBayDetails = document;
            callback(null, 'eBayDetails');
          }); // findOne
        }); // collection
      }); // mongo
    },
    
    /* CategoryFeatures */
    function(callback) {
      mongo(function(db) {
        db.collection(item.mod.Site + '.CategoryFeatures', function(err, coll) {
          coll.findOne({}, function(err, document) {
            json.CategoryFeatures = document;
            callback(null, 'CategoryFeatures');
          }); // findOne
        }); // collection
      }); // mongo
    },
    
    /* ThemeGroup */
    function(callback) {
      
      var rows = {}
      
      mongo(function(db) {
        db.collection(item.mod.Site + '.DescriptionTemplates.ThemeGroup', function(err, coll) {
          coll.find().toArray(function(err, docs) {
            
            docs.forEach(function(doc) {
              rows[doc._id] = doc;
            });
            json.ThemeGroup = rows;
            
            callback(null, 'DescriptionTemplates');
          }); // find
        }); // collection
      }); // mongo
    }
    
  ], function(err, results) {
    
    json.item = item;
    callback(null, json);
    
  });
  
} // _item()

function updatemessage(email, hasnext, message) {
  
  mongo(function(db) {
    db.collection('users', function(err, coll) {
      coll.update(
        {
          email: email
        },
        {
          $set: {
            message: {
              datetime: now,
              hasnext: hasnext,
              message: message
            }
          }
        }
      ); // update
    }); // collection
  }); // mongo
  
} // updatemessage()

function writesocket_async(args) {
  
  var net = require('net');
  
  var socket = new net.Socket();
  socket.connect(config.daemonport, 'localhost');
  socket.on('connect', function() {
    socket.write(args.join("\n") + "\n", function() {
      socket.end();
    });
  });
  
}

function writesocket(args, callback) {
  
  var net = require('net');
  
  var socket = new net.Socket();
  socket.connect(config.daemonport, 'localhost');
  socket.on('connect', function() {
    socket.write(args.join("\n") + "\n", function(err, result) {
      socket.end();
    });
  });
  
  socket.on('close', function() {
    callback(null, null);
  });
  
}

function send_signup_confirm_mail(emailto, emaildata) {
  
  /* Send confirmation mail */
  var templatedir = '/var/www/' + config.hostname + '/node/templates';
  
  emailTemplates(templatedir, function(err, template) {
    
    var smtpTransport = nodemailer.createTransport("SMTP", {
      host: 'localhost'
    });
    
    template('signup', emaildata, function(err, html, text) {
      
      smtpTransport.sendMail(
        {
          from: 'ListersIn <support@' + config.hostname + '>',
          to: emailto,
          subject: 'Thank you for signing up for ListersIn!',
          text: text,
          html: html
        }, 
        function(error, response) {
          
          if (error) {
            console.log(error);
          } else {
            console.log("Message sent: " + response.message);
          }
          
          smtpTransport.close();
        }
      ); // sendMail
    }); // template
    
  }); // emailTemplates
  
}

function sendmail(subject, templatename, emailto, emaildata) {
  
  /* Send confirmation mail */
  var templatedir = '/var/www/' + config.hostname + '/node/templates';
  
  emailTemplates(templatedir, function(err, template) {
    
    var smtpTransport = nodemailer.createTransport("SMTP", {
      host: 'localhost'
    });
    
    template(templatename, emaildata, function(err, html, text) {
      
      smtpTransport.sendMail(
        {
          from: 'ListersIn <support@' + config.hostname + '>',
          to: emailto,
          subject: subject,
          text: text,
          html: html
        }, 
        function(error, response) {
          
          if (error) {
            console.log(error);
          } else {
            console.log("Message sent: " + response.message);
          }
          
          smtpTransport.close();
        }
      ); // sendMail
    }); // template
    
  }); // emailTemplates
  
}

function extractObject(formdata) {
  
  var mod = {};
  
  Object.keys(formdata).forEach(function(key) {
    
    var ref = mod;
    
    //console.log('key: ' + key);
    var arrkey = key.split('.');
    for (var i = 0; i < arrkey.length; i++) {
      //console.log(' for: ' + arrkey[i]);
      
      if (i == arrkey.length - 1) {
        ref[arrkey[i]] = formdata[key];
      }
      
      if (!ref.hasOwnProperty(arrkey[i])) {
        ref[arrkey[i]] = {};
      }
      
      ref = ref[arrkey[i]];
    }
    
  });
  
  return mod;
}


function convertint(o, field) {
  
  var path = field.split('.');
  
  if (!o.hasOwnProperty(path[0])) return;
  if (o[path[0]] == null) return;
  
  /* leaf */
  if (path.length == 1) {
    o[path[0]] = parseInt(o[path[0]]);
    return;
  }
  
  /* not leaf */
  var shifted = path.shift();
  if (util.isArray(o[shifted])) {
    for (var i = 0; i < o[shifted].length; i++) {
      convertint(o[shifted][i], path.join('.'));
    }
  } else {
    convertint(o[shifted], path.join('.'));
  }
  
  return;
  
} // convertint

function convertdouble(o, field) {
  
  var path = field.split('.');
  
  if (!o.hasOwnProperty(path[0])) return;
  if (o[path[0]] == null) return;
  
  /* leaf */
  if (path.length == 1) {
    o[path[0]] = parseFloat(o[path[0]]);
    return;
  }
  
  /* not leaf */
  var shifted = path.shift();
  if (util.isArray(o[shifted])) {
    for (var i = 0; i < o[shifted].length; i++) {
      convertdouble(o[shifted][i], path.join('.'));
    }
  } else {
    convertdouble(o[shifted], path.join('.'));
  }
  
  return;
  
} // convertdouble

function convertdate(o, field) {
  
  var path = field.split('.');
  
  if (!o.hasOwnProperty(path[0])) return;
  if (o[path[0]] == null) return;
  
  /* leaf */
  if (path.length == 1) {
    o[path[0]] = moment(o[path[0]])._d;
    return;
  }
  
  /* not leaf */
  var shifted = path.shift();
  if (util.isArray(o[shifted])) {
    for (var i = 0; i < o[shifted].length; i++) {
      convertdate(o[shifted][i], path.join('.'));
    }
  } else {
    convertdate(o[shifted], path.join('.'));
  }
  
  return;
  
} // convertdate
