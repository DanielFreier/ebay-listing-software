var config = require('../config');
var mongo  = require('./mongoconnect');
var moment = require('moment');
var util   = require('util');
var async  = require('async');
var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates')
var crypto = require('crypto');

/* Admin panel */
exports.index = function(req, res) {
    
    res.cookie('admin', 1, {maxAge: 86400*365});
    req.session.admin = 1;
    
    mongo(function(db) {
        
        db.collection('users', function(err, collection) {
            
            collection.find().sort({
                lastused_at: -1,
                created_at: -1,
                _id: -1
            }).limit(50).toArray(function(err, users) {
                
                users.forEach(function(user) {
                    
                    if (user.hasOwnProperty('created_at')) {
                        user.created_at = moment(user.created_at).format('MM-DD HH:mm');
                    }
                    if (user.hasOwnProperty('lastused_at')) {
                        user.lastused_at = moment(user.lastused_at).format('MM-DD HH:mm');
                    }
                    if (user.hasOwnProperty('period')) {
                        
                        var now = moment();
                        var exp = moment(user.period.end);
                        if (now <= exp) {
                            user.expired = false;
                        } else {
                            user.expired = true;
                        }
                        
                        user.period.start = moment(user.period.start).format('MM-DD HH:mm');
                        user.period.end   = moment(user.period.end  ).format('MM-DD HH:mm');
                    }
                    
                }); // users.forEach
                
                res.render('admin/index', {
                    users: users,
                });
                
            }); // find
        }); // collection
    }); // mongo
    
} // exports.index

exports.index2 = function(req, res) {
  
  res.cookie('admin', 1, {maxAge: 86400*365});
  
  mongo(function(db) {
    
    db.collection('users', function(err, collection) {
      
      collection.find().sort({
        lastused_at: -1,
        created_at: -1,
        _id: -1
      }).toArray(function(err, users) {
        
        var summarytotal = {
          empty:     {truez: 0, falsez: 0,},
          Active:    {truez: 0, falsez: 0,},
          Completed: {truez: 0, falsez: 0,},
          Unanswered: 0,
          Answered: 0
        };
        
        users.forEach(function(user) {
          
          if (user.hasOwnProperty('created_at')) {
            user.created_at = moment(user.created_at).format('YYYY-MM-DD HH:mm');
          }
          if (user.hasOwnProperty('lastused_at')) {
            user.lastused_at = moment(user.lastused_at).format('YYYY-MM-DD HH:mm');
          }
          if (user.hasOwnProperty('period')) {
            
            var now = moment();
            var exp = moment(user.period.end);
            if (now <= exp) {
              user.expired = false;
            } else {
              user.expired = true;
            }
            
            user.period.start = moment(user.period.start).format('YYYY-MM-DD HH:mm');
            user.period.end   = moment(user.period.end  ).format('YYYY-MM-DD HH:mm');
          }
          
          if (user.hasOwnProperty('userids2')) {
            user.userids2.forEach(function(userid) {
              
              if (userid.hasOwnProperty('summary')) {
                Object.keys(userid.summary).forEach(function(key) {
                  Object.keys(userid.summary[key]).forEach(function(key2) {
                    summarytotal[key][key2] += userid.summary[key][key2];
                  });
                });
              }
              
              if (userid.hasOwnProperty('membermessages')) {
                Object.keys(userid.membermessages).forEach(function(key) {
                  if (key == '') return;
                  summarytotal[key] += userid.membermessages[key];
                });
              }
              
              userid.notification_enabled = 0;
              userid.notification_disabled = 0;
              
              if (userid.hasOwnProperty('NotificationEnable')) {
                userid.NotificationEnable.forEach(function(elm) {
                  if (elm.EventEnable == 'Enable') {
                    userid.notification_enabled++;
                  } else {
                    userid.notification_disabled++;
                  }
                });
              }
              
            });
          } // userids2
          
        }); // users.forEach
        
        res.render('admin_bootstrap', {
          users: users,
          summarytotal: summarytotal,
          remoteaddr: req.headers['x-forwarded-for']
        });
        
      }); // find
      
    }); // collection
    
  }); // mongo
  
  req.session.admin = 1;
};

exports.signin = function(req, res) {
    
    var url = require('url');
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    
    var email = query.email;
    email = email.replace(/ /, '+');
    
    mongo(function(db) {
        
        db.collection('users', function(err, collection) {
            
            collection.find({email: email}).toArray(function(err, users) {
                
                users.forEach(function(user) {
                    
                    var decipher = crypto.createDecipher('aes-256-cbc', config.auth_secret);
                    var dec = decipher.update(user.password_encrypted, 'hex','utf8')
                        + decipher.final('utf8');
                    
                    res.render('signin', {
                        email: email, 
                        password: dec
                    });
                });
                
            });
            
        });
    }); // mongo
    
} // signin

exports.callapi = function(req, res) {
  
  var callname = req.body.callname;
  
  var apimodule = require('./ebayapi/' + callname);
  
  apimodule.call(req.body, function(response) {
    res.json(response);
  });
  
  return;
}

exports.test = function(req, res) {
  
  var apimodule = require('./ebayapi/GetUserDisputes');
  
  apimodule.call({
    
    email:  'dino.77@optusnet.com.au',
    userid: 'www-customcans-com-au'
    
  }, function(response) {
    console.dir(response);
    res.json(response);
  });
  
}

exports.listeditems = function(req, res) {
  
  mongo(function(db) {
    db.collection('listeditems', function(err, collection) {
      collection.find({
        status: 'Active'
      }).sort({endtime: -1}).toArray(function(err, items) {
        
        items.forEach(function(item) {
          item.starttime = moment(item.starttime).format('YYYY-MM-DD HH:mm');
          item.endtime   = moment(item.endtime).format('YYYY-MM-DD HH:mm');
        });
        
        res.render('listeditems', {items: items});
      });
    }); // collection
  }); // mongo

} // listeditems

exports.unanswered = function(req, res) {
  
  async.waterfall([
    
    function (callback) {
      
      var targetusers = [];
      
      mongo(function(db) {
        db.collection('users', function(err, usercoll) {
          
          console.log(moment.utc().format('YYYY-MM-DD HH:mm:ss') + ' <-[UTC]');
          
          usercoll.find({
            
          }).sort({
            
            timezone: 1
            
          }).toArray(function(err, users) {
            
            users.forEach(function(user) {
              
              var zonestr = user.timezone.replace(/^GMT/, '');
              var nowhour = moment().zone(zonestr).format('H');
              
              // filter users "local time is am9:00"
              if (true || nowhour == 9) {
                console.log(nowhour + ' <-[' + zonestr + '] ' + user.email);
                targetusers.push(user);
              }
              
            }); // users
            
            callback(null, targetusers);
            
          }); // find
        }); // collection
      }); // mongo
    },
    
    function (users, callback) {
      
      var templatedir = '/var/www/listers.in/node/templates';
      
      var ago = moment().subtract('days', 7);
      
      var query = {
        'org.SellingStatus.ListingStatus': 'Active',
        'membermessages.MessageStatus': 'Unanswered',
        'membermessages.CreationDate': {
          $gt: ago._d
        }
      };
      
      var fields = {
        'org.ItemID': true,
        'org.Title': true,
        'membermessages': true
      };
      
      users.forEach(function(user) {
        
        var zonestr = user.timezone.replace(/^GMT/, '');
        if (zonestr == 'Etc/GMT+8') zonestr = '+08:00';
        
        mongo(function(db) {
          db.collection('items.' + user._id, function(err, itemcoll) {
            itemcoll.find(query, fields).toArray(function(err, items) {
              if (items.length == 0) return;
              
              var ago = moment().subtract('days', 7);
              
              var qcnt = 0;
              for (var i = 0; i < items.length; i++) {
                for (var j = 0; j < items[i].membermessages.length; j++) {
                  
                  console.log(items[i].membermessages[j].CreationDate);
                  
                  qcnt++;
                  
                  items[i].membermessages[j].CreationDate_local
                    = moment(items[i].membermessages[j].CreationDate)
                    .zone(zonestr)
                    .format('MMM D HH:mm');
                }
              }
              
              if (qcnt == 0) return;
              
              console.log('[' + user.email + ']'
                          + ' ' + items.length + ' items,'
                          + ' ' + qcnt + ' questions.');
              return;
              emailTemplates(templatedir, function(err, template) {
                
                var smtpTransport = nodemailer.createTransport("SMTP", {
                  host: 'localhost'
                });
                
                var emaildata = {
                  user: user,
                  items: items,
                  qcnt: qcnt
                };
                
                template('unanswered', emaildata, function(err, html, text) {
                  
                  smtpTransport.sendMail(
                    {
                      from: 'ListersIn <support@listers.in>',
                      to: 'admin@listers.in',
                      subject: qcnt + ' questions in ' + items.length + ' items ('+user.email+')',
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
              
            }); // find
            
          }); // collection
        }); // mongo
        
      });
      
    }
    
  ], function(err, result) {
    
    
    
  });
  
  res.end();
} // exports.unanswered

exports.sendinformationmail = function(req, res) {
  
  //res.end();
  
  var templatedir = '/var/www/listers.in/node/templates';
  
  emailTemplates(templatedir, function(err, template) {
    
    mongo(function(db) {
      db.collection('users', function(err, collection) {
        collection.find(
          {
            receiveinfo: true,
            email: {
              $ne: 'cptechworld@gmail.com'
            }
          },
          {
            email: true
          }
        ).toArray(function(err, users) {
          
          return;
          
          template('information', {}, function(err, html, text) {
            
            async.whilst(
              function() {
                return users.length > 0;
              },
              function(callback) {
                var user = users.shift();
                
                console.log(user.email);
                
                var smtpTransport = nodemailer.createTransport("SMTP", {
                  host: 'localhost'
                });
                
                smtpTransport.sendMail(
                  {
                    from: 'listers.in - eBay listing software<support@listers.in>',
                    to: user.email,
                    bcc: 'listersin+bcc@gmail.com',
                    subject: 'Send a second chance offer',
                    text: text,
                    html: html
                  }, 
                  function(error, response) {
                    
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Sent ' + user.email + ' ' + response.message);
                    }
                    
                    smtpTransport.close();
                    
                    callback(null, null);
                  }
                ); // sendMail
                
              },
              function(err) {
              }
            );
            
          }); // template
        });
      });
    }); // template
  }); // emailTemplates
  
}; // mailtest
