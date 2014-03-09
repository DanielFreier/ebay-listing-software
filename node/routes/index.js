var mongo      = require('./mongoconnect');
var moment     = require('moment');
var net        = require('net');
var config     = require('../config');
var nodemailer = require('nodemailer');
var fs         = require('fs');
var async      = require('async');
var moment     = require('moment');
var util       = require('util');

exports.list = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  if (query.request_locale) {
    req.locale = query.request_locale;
  }
  
	/* Default date range value for sync item form */
  var mischash = {};
  mischash.datestart = moment().subtract('days', 59).format('YYYY-MM-DD');
  mischash.dateend   = moment().add('days', 60).format('YYYY-MM-DD');
  
  mongo(function(db) {

    async.parallel({
      
      ebaydetails: function(callback) {
        
        db.collection('US.eBayDetails', function(err, coll) {
          coll.findOne(
            {}, 
            {
              'SiteDetails.Site': true,
              'SiteDetails.SiteID': true,
              'CurrencyDetails.Currency': true
            },
            function(err, doc) {
              callback(null, doc);
            }
          );
        });
        
      },
      
      templates: function(callback) {
        db.collection('items.' + req.user._id, function(err, itemcoll) {
          itemcoll.find(
            {
              'opt.template': 'true'
            },
            {
              'mod.Title': true
            }
          ).toArray(function(err, docs) {
            callback(null, docs);
          });
        })
      }
      
    }, function(err, results) {
      
      res.render('list', {
        user: req.user,
        US: {
          eBayDetails: results.ebaydetails
        },
        templates: results.templates,
        mischash: mischash
      })
      
    }); // async.parallel
    
  }); // mongo
  
} // exports.list()

exports.index = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  if (query.request_locale) {
    req.locale = query.request_locale;
  }
  
  if (req.isAuthenticated()) {
    
		/* Default date range value for sync item form */
    var mischash = {};
    mischash.datestart = moment().subtract('days', 59).format('YYYY-MM-DD');
    mischash.dateend   = moment().add('days', 60).format('YYYY-MM-DD');
    
    res.render('user', { 
      user: req.user,
      locale: req.locale,
      mischash: JSON.stringify(mischash),
      remoteaddr: req.headers['x-forwarded-for']
    });
    
  } else {
    
    var xml2js = require('xml2js');
    var parser = xml2js.Parser({
        explicitArray: false
    });
    
    async.parallel({
      
      blogjson: function(callback) {
        
        var blogxml;
        
        if (req.locale == 'ja') {
          blogxml = fs.readFileSync(config.ameblofile);
        } else {
          blogxml = fs.readFileSync(config.blogfile);
        }
        
        parser.parseString(blogxml, function (err, resultjson) {
          callback(null, resultjson.rss.channel.item);
        });
      },
      
      githubjson: function(callback) {
        var blogxml = fs.readFileSync(config.githubfile);
        parser.parseString(blogxml, function (err, resultjson) {
          callback(null, resultjson.feed.entry);
        });
      },
      
    }, function(err, results) {
      
      if (true || query.hasOwnProperty('bootstrap')) {
        
        res.render('index_bootstrap', { 
          title: 'Express' ,
          locale: req.locale,
          feeds: results
        });
        
      } else {
        
        res.render('index', { 
          title: 'Express' ,
          locale: req.locale,
          feeds: results
        });
        
      }
      
    });
    
    
    
  }

};

exports.signup_confirm = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  var token = query.t;
  
  mongo(function(db) {
    db.collection('users', function(err, collection) {
      
      collection.findOne(
        {
          status: 'temporary registration',
          tmptoken: token
        }, 
        function(err, user) {
          if (user) {
            
            var now = moment();
            var plan_start = moment();
            var plan_end = moment().add('days', 30);
            
            collection.update(
              {
                email: user.email
              },
              {
                $set: {
                  status: 'trial',
                  period: {
                    start: plan_start._d,
                    end: plan_end._d,
                  },
                  lastused_at: now._d
                }
              },
              function(err, result) {
                res.render('signin', {
                  email: user.email,
                  password: user.password
                });
              }
            );
            
          } else {
            
            console.log('temporary user not found.');
            res.redirect('/');
            
          }
        }
      ); // findOne
      
    }); // collection
    
  }); // mongo
  
};


exports.sendmail = function(req, res) {
  
  var smtpTransport = nodemailer.createTransport("SMTP", {
    host: 'localhost'
  });
  
  var mailOptions = {
    from: 'listersin@gmail.com',
    to: 'fd3s.boost@gmail.com',
    subject: 'test node mail',
    text: 'text part',
    html: '<b>html part</b>'
  }
  
  smtpTransport.sendMail(mailOptions, function(error, response) {
    
    if (error) {
      console.log(error);
    }else{
      console.log("Message sent: " + response.message);
    }
    
    smtpTransport.close();
  });
  
  res.end();
};

exports.receivenotify = function(req, res) {
  
  var xml = '';
  
  req.on('data', function(chunk) {
    xml += chunk;
  });
  
  req.on('end', function() {
    
    /* xml -> json */
    var xml2js = require('xml2js');
    var parser = xml2js.Parser({
      attrkey: '@',
      charkey: '#text',
      explicitArray: false
    });
    
    /* return to callback */
    parser.parseString(xml, function (err, json) {
      
      var keys = Object.keys(json['soapenv:Envelope']['soapenv:Body']);
      var rootname = keys[0];
      var body = json['soapenv:Envelope']['soapenv:Body'][rootname];
      var eventname = body.NotificationEventName;
      var userid = body.RecipientUserID;
      
      console.log(moment().format('YYYY-MM-DD HH:mm:ss') 
                  + '          /receivenotify'
                  + ' ' + userid + ' ' + rootname + ' ' + eventname);
      
      //res.end();
      
      /* save xml file */
      var savedir = '/var/www/listers.in/logs/apicall/notification/' + eventname;
      if (!fs.existsSync(savedir)) fs.mkdirSync(savedir);
      
      savedir += '/' + moment().format('YYYY-MM-DD');
      if (!fs.existsSync(savedir)) fs.mkdirSync(savedir);
      
      fs.writeFileSync(savedir + '/' + userid + '.' + body.CorrelationID + '.xml', xml);
      
      res.end();
      
      /* GetMemberMessages */
      if (eventname == 'AskSellerQuestion') {
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.findOne({'userids2.username': userid}, function(err, user) {
              if (!user) return;
              
              var ebayuser = null;
              user.userids2.forEach(function(tmpuser) {
                if (tmpuser.username != userid) return;
                ebayuser = tmpuser;
              });
              
              db.collection('items.' + user._id, function(err, itemcoll) {
                
                if (ebayuser.sync) {
                  var getmm = require('./ebayapi/GetMemberMessages');
                  getmm.upsert(user.email, body.MemberMessage.MemberMessageExchange, itemcoll);
                  return;
                }
                
                itemcoll.findOne(
                  {'org.ItemID': body.MemberMessage.MemberMessageExchange.Item.ItemID},
                  function(err, item) {
                    if (!item) return;
                    var getmm = require('./ebayapi/GetMemberMessages');
                    getmm.upsert(user.email, body.MemberMessage.MemberMessageExchange, itemcoll);
                  }
                );
                
              });
              
            }); // findOne
          }); // collection
        }); // mongo
      }
      
      /* GetItem */
      if (rootname == 'GetItemResponse') {
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.findOne({'userids2.username': userid}, function(err, user) {
              if (!user) return
              
              var ebayuser = null;
              user.userids2.forEach(function(tmpuser) {
                if (tmpuser.username != userid) return;
                ebayuser = tmpuser;
              });
              
              db.collection('items.' + user._id, function(err, itemcoll) {
                
                if (ebayuser.sync) {
                  var getitem = require('./ebayapi/GetItem');
                  getitem.upsert(body.Item, itemcoll);
                  return;
                }
                
                itemcoll.findOne(
                  {'org.ItemID': body.Item.ItemID},
                  function(err, item) {
                    if (!item) return;
                    
                    var getitem = require('./ebayapi/GetItem');
                    getitem.upsert(body.Item, itemcoll);
                  }
                )
                
              });
            }); // findOne
          }); // collection
        }); // mongo
      } // rootname == 'GetItemResponse'
      
      // todo: are ItemUnsold and ItemClosed same?
      if (eventname == 'ItemUnsold') {
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.findOne({'userids2.username': userid}, function(err, user) {
              if (user) {
                db.collection('items.' + user._id, function(err, itemcoll) {
                  
                  itemcoll.findOne({
                    'org.ItemID': body.Item.ItemID
                  }, function(err, item) {
                    
                    if (item == null) return;
                    
                    if (item.hasOwnProperty('opt')) {
                      
                      console.log('AutoRelist: ' + item.opt.AutoRelist);
                      
                      if (item.opt.AutoRelist == 'true') {
                        
                        var taskid = 'autorelist'
                          + '_' + moment().format('YYYYMMDD_HHmmss') 
                          + '_' + item.org.ItemID;
                        
                        console.log('AutoRelist taskid: ' + taskid);
                        console.log(item.org.ItemID);
                        console.log(item.org.Title);
                        
                        itemcoll.update(
                          {
                            _id: item._id
                          }, 
                          {
                            $set: {
                              status: taskid
                            }
                          }, 
                          function(err, result) {
                            
                            var net = require('net');
                            
                            var socket = new net.Socket();
                            
                            socket.connect(8181, 'localhost');
                            
                            socket.on('connect', function() {
                              socket.write('RelistItem' + "\n" 
                                           + user.email + "\n"
                                           + taskid,
                                           function() {
                                             socket.end();
                                           });
                            });
                            
                          }
                        );
                        
                      } // AutoRelist == true
                    } // opt
                    
                  });
                  
                });
              }
            }); // findOne
          }); // collection
        }); // mongo
      } // ItemUnsold
      
    });
  });
  
} // receivenotify

exports.index_bootstrap = function(req, res) {
  
  res.render('index_bootstrap', {
  });
  
} // exports.index_bootstrap

exports.reset_password = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  var query = {
    tmptoken: query.t
  };
  
  mongo(function(db) {
    db.collection('users', function(err, coll) {
      coll.findOne(query, function(err, user) {
        if (user) {
          res.render('resetpassword', {
            user: user
          });
        } else {
          res.redirect('/');
        }
      }); // findOne
    }); // collection
  }); // mongo
        
} // exports.reset_password

exports.cancelaccount = function(req, res) {
  
  // todo: don't remove record, move instead.
  mongo(function(db) {
    db.collection('users', function(err, coll) {
      coll.remove({
        email: req.user.email
      });
    }); // collection
  }); // mongo
  
  res.redirect('/');
  
} // exports.cancelaccount

exports.accept = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  var username  = query.username;
  var email     = req.user.email;
  var sessionid = req.user.sessionid;
  
  /* FetchToken */
  var args = ['FetchToken', email, sessionid, username];
  writesocket(args, function() {}); // wait
  
  /* SetNotificationPreferences */
  var args = ['SetNotificationPreferences', email, username];
  writesocket_async(args); // not wait
  
  updatemessage(email, true, 'Importing ' + username + '\'s items from eBay'
                + ' which end between ' + moment().subtract('days', 59).format('YYYY-MM-DD')
                + ' and ' + moment().add('days', 60).format('YYYY-MM-DD') + '.');
  
  /* GetSellerList */
  var args = [
    'GetSellerList',
    email,
    username,
    'End',
    moment().subtract('days', 59).format('YYYY-MM-DD'),
    moment().add('days', 60).format('YYYY-MM-DD'),
    'ReturnAll'
  ];
  writesocket_async(args); // not wait
  
  res.redirect('/');
  
} // exports.accept

exports.paypalipn = function(req, res) {
  res.end();
  
  var now = moment();
  
  mongo(function(db) {
    
    db.collection('paypalipn', function(err, coll) {
      coll.insert({
        date: now._d,
        ipn: req.body
      });
    }); // collection
    
    if (req.body.txn_type == 'subscr_payment') {
      
      var plan_start = moment();
      var plan_end = moment().add('days', 32);
      
      if (req.body.transaction_subject == 'listers.in starter plan') {
        plan = 'starter';
      } else if (req.body.transaction_subject == 'listers.in business plan') {
        plan = 'business';
      }
      
      db.collection('users', function(err, coll) {
        coll.update(
          {
            email: req.body.custom
          },
          {
            $set: {
              status: plan,
              period: {
                start: plan_start._d,
                end: plan_end._d,
              },
            }
          }
        );
      }); // collection
      
    } else if (req.body.txn_type == 'subscr_cancel') {
      
      db.collection('users', function(err, coll) {
        coll.update(
          {
            email: req.body.custom
          },
          {
            $set: {
              period: {
                end: now._d,
              },
            }
          }
        );
      }); // collection
      
    }
    
  }); // mongo

}

exports.paypalreturn = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  if (query.st == 'Completed') {
    
    var plan_start = moment();
    var plan_end = moment().add('days', 31);
    
    if (query.amt == '9.95') {
      plan = 'starter';
    } else if (query.amt == '14.95') {
      plan = 'business';
    }
    
    mongo(function(db) {
      db.collection('users', function(err, coll) {
        coll.update(
          {
            email: query.cm
          },
          {
            $set: {
              status: plan,
              period: {
                start: plan_start._d,
                end: plan_end._d,
              },
            }
          }
        );
      }); // collection
    }); // mongo
  }
  
  res.redirect('/#/settings');
}

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

function updatemessage(email, hasnext, message) {
  
  var now = new Date();
  
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
