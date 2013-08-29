var mongo  = require('./mongoconnect');
var moment = require('moment');
var util   = require('util');
var async  = require('async');
var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates')

/* Admin panel */
exports.index = function(req, res) {
  
  res.cookie('admin', 1, {maxAge: 86400*365});
  
  mongo(function(db) {
    
    db.collection('users', function(err, collection) {
      
      collection.find().sort({
        lastused: -1,
        created: -1,
        _id: -1
      }).toArray(function(err, users) {
        
        var summarytotal = {
          empty:     {truez: 0, falsez: 0,},
          Active:    {truez: 0, falsez: 0,},
          Completed: {truez: 0, falsez: 0,}
        };
        
        users.forEach(function(user) {
          if (user.hasOwnProperty('created_at')) {
            user.created_at = moment(user.created_at).format('MM/DD HH:mm');
          }
          if (user.hasOwnProperty('lastused_at')) {
            user.lastused_at = moment(user.lastused_at).format('MM/DD HH:mm');
          }
          
          if (user.hasOwnProperty('userids2')) {
            user.userids2.forEach(function(userid) {
              if (!userid.hasOwnProperty('summary')) return;
              Object.keys(userid.summary).forEach(function(key) {
                Object.keys(userid.summary[key]).forEach(function(key2) {
                  summarytotal[key][key2] += userid.summary[key][key2];
                });
              });
            })
          }
          
        }); // forEach
        
        res.render('admin', {
          users: users,
          summarytotal: summarytotal
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
          res.render('signin', {
            email: email, 
            password: user.password
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
    
    console.log('admin.callapi response to browser: [' + response + ']');
    
    //res.writeHead(200, {'Content-Type': 'application/json'});
    //res.write(JSON.stringify(response));
    res.end();
    
  });
  
  return;
}

exports.listeditems = function(req, res) {
  
  mongo(function(db) {
    db.collection('listeditems', function(err, collection) {
      collection.find({
        status: 'Active'
      }).sort({starttime: -1}).toArray(function(err, items) {

        items.forEach(function(item) {
          item.starttime = moment(item.starttime).format('MM-DD HH:mm');
          item.endtime   = moment(item.endtime).format('MM-DD HH:mm');
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
              if (nowhour == 9) {
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
}
