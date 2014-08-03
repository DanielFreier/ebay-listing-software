var async  = require('async');
var config = require('./config');
var http   = require('http');
var moment = require('moment');
var mongo  = require('./routes/mongoconnect');
var net    = require('net');
var querystring = require('querystring'); 
var https = require('https');
var crypto = require('crypto');

mongo(function(db) {
    db.collection('users', function(err, coll) {
        
        var activeusers = {
            email: 'ebehay@gmail.com',
            'lastused_at': {
                $gte: moment('2014-06-01')._d
            }
        };
        
        coll.find(activeusers).toArray(function(err, users) {
            
            users.forEach(function(user) {
                
                console.log(user.email);
                
                if (!user.hasOwnProperty('userids2')) return;
                if (user.email == 'demo@listers.in') return;
                
                user.userids2.forEach(function(account) {
                    
                    //if (!account.hasOwnProperty('TokenStatus')) return;
                    //if (account.TokenStatus.Status != 'Active') return;
                    
                    console.log(user.email + ' ' + account.username);
                    
                    var reqjson = {
                        callname: 'GetSellerTransactions',
                        email: user.email,
                        userid: account.username
                    };
                    
                    var apimodule = require('./routes/ebayapi/GetSellerTransactions');
                    
                    apimodule.call(reqjson, function(err, response) {
                    });
                    
                    return;
                    
                    var postdata = querystring.stringify(postjson);
                    
                    var options = {
                        host: 'listers.in',
                        path: '/node/admin/callapi',
                        port: 443,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Content-Length': postdata.length
                        }
                    }
                    
                    var req = https.request(options, function(res) {
                    });
                    
                    req.write(postdata);
                    req.end();
                });
            });
            
            //process.exit();
            
        });
        
        
        return;
        
        coll.find().toArray(function(err, users) {
            users.forEach(function(user) {
                
                var cipher = crypto.createCipher('aes-256-cbc', config.auth_secret);
                var encrypted = cipher.update(user.password, 'utf8','hex') + cipher.final('hex');
                
                coll.update(
                    {
                        _id: user._id,
                        email: user.email
                    },
                    {
                        $set: {
                            password_encrypted: encrypted
                        }
                    }
                );
                
            });
        });
        
        return;
        
        coll.find(
            {
                'period.end': {
                    $gte: moment()._d
                }
            }
        ).toArray(function(err, users) {
            
            users.forEach(function(user) {
                
                if (!user.hasOwnProperty('userids2')) return;
                if (user.email == 'demo@listers.in') return;
                
                user.userids2.forEach(function(account) {
                    
                    //if (account.TokenStatus.Status != 'Active') return;
                    
                    console.log(user.email + ' ' + account.username);
                    
                    var postjson = {
                        //callname: 'GetUserDisputes',
                        callname: 'GetNotificationPreferences',
                        email: user.email,
                        userid: account.username
                    };
                    
                    var postdata = querystring.stringify(postjson);
                    
                    var options = {
                        host: 'listers.in',
                        path: '/node/admin/callapi',
                        port: 443,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Content-Length': postdata.length
                        }
                    }
                    
                    var req = https.request(options, function(res) {
                    });
                    
                    req.write(postdata);
                    
                    req.end();
                    
                });
            });
            
            //process.exit();
            
        });
        
    }); // users
}); // mongo
