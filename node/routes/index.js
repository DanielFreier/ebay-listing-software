var mongo      = require('./mongoconnect');
var config     = require('../config');
var nodemailer = require('nodemailer');
var fs         = require('fs');
var async      = require('async');
var moment     = require('moment');
var util       = require('util');

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
      
      res.render('index', { 
        title: 'Express' ,
        locale: req.locale,
        feeds: results
      });
      
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
            
            console.log('temporary user found: ' + user.email);
            
            collection.update(
              {email: user.email},
              {$set: {status: 'free trial'}},
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
  
  res.end();
  
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
      
      /* save xml file */
      var savedir = '/var/www/listers.in/logs/apicall/notification/' + eventname;
      if (!fs.existsSync(savedir)) fs.mkdirSync(savedir);
      
      savedir += '/' + moment().format('YYYY-MM-DD');
      if (!fs.existsSync(savedir)) fs.mkdirSync(savedir);
      
      fs.writeFile(savedir + '/' + userid + '.' + body.CorrelationID + '.xml', xml);
      
      /* GetMemberMessages */
      if (eventname == 'AskSellerQuestion') {
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.findOne({'userids2.username': userid}, function(err, user) {
              if (user) {
                db.collection('items.' + user._id, function(err, itemcoll) {
                  var getmm = require('./ebayapi/GetMemberMessages');
                  getmm.upsert(user.email, body.MemberMessage.MemberMessageExchange, itemcoll);
                });
              }
            }); // findOne
          }); // collection
        }); // mongo
      }
      
      /* GetItem */
      if (rootname == 'GetItemResponse') {
        mongo(function(db) {
          db.collection('users', function(err, collection) {
            collection.findOne({'userids2.username': userid}, function(err, user) {
              if (user) {
                db.collection('items.' + user._id, function(err, itemcoll) {
                  var getitem = require('./ebayapi/GetItem');
                  getitem.upsert(body.Item, itemcoll);
                });
              }
            }); // findOne
          }); // collection
        }); // mongo
      }
      
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
  
}

exports.index_bootstrap = function(req, res) {
  
  res.render('index_bootstrap', {
  });
  
} // index_bootstrap

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
        
} // reset_password

exports.cancelaccount = function(req, res) {
  
  mongo(function(db) {
    db.collection('users', function(err, coll) {
      coll.remove({
        email: req.user.email
      });
    }); // collection
  }); // mongo
  
  res.redirect('/');
  
} // cancelaccount
