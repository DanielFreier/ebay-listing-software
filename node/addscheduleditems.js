var async  = require('async');
var config = require('./config');
var http   = require('http');
var moment = require('moment');
var mongo  = require('./routes/mongoconnect');
var net    = require('net');
var querystring = require('querystring'); 

mongo(function(db) {
  db.collection('users', function(err, coll) {
    
    var nowstr = moment().format('YYYY-MM-DD HH:mm');
    var now = moment(nowstr, 'YYYY-MM-DD HH:mm');
    
    coll.find(
      {
        'period.end': {
          $gte: moment()._d
        },
        email: 'cptechworld@gmail.com'
      }
    ).sort(
      {
        'period.end': -1
      }
    ).toArray(function(err, users) {
      
      async.times(users.length, function(idx, callback) {
        
        var user = users[idx];
        
        db.collection('items.' + user._id, function(err, itemcoll) {
          
          itemcoll.find(
            {
              'opt.ScheduleType': 'listersin',
              'opt.ScheduleTime': now._d
            }
          ).toArray(function(err, items) {
            
            //console.dir(err);
            
            if (items.length == 0) {
              callback(null, null);
              return;
            }
              
            console.log('-----------------');
            console.dir(now._d);
            console.log('[' + user.email + ']');
            
            var ids = [];
            
            for (var i = 0; i < items.length; i++) {
              // use ObjectID, not string.
              ids.push(items[i]._id);
              console.log(items[i].mod.Title);
            }
            
            /* same as exports.add() in json.js */
            var taskid = 'add_' + moment().format('YYYY-MM-DD_HH-mm-ss');
            
            itemcoll.update(
              {
                _id: {
                  $in: ids
                }
              },
              {
                $set: {
                  status: taskid
                }
              },
              {
                multi: true,
                safe: true
              },
              function(err, result) {
                
                var args = ['AddItems', user.email, taskid];
                writesocket(args, function(err, result) {
                  callback(null, null);
                });
                
              }
            );
            
          }); // toArray
          
        }); // collection
        
      }, function(err, result) {
        
        process.exit();
        
      }); // async.times
      
    }); // user.find
  }); // users
}); // mongo

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
