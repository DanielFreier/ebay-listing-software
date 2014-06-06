/**
 * Module dependencies.
 */

var config = require('./config');
var crypto = require('crypto');
var mongo = require('./routes/mongoconnect');

var express = require('express')
, routes = require('./routes')
, user   = require('./routes/user')
, json   = require('./routes/json')
, file   = require('./routes/file')
, admin  = require('./routes/admin')
, image  = require('./routes/image')
, index  = require('./routes/index')
, category = require('./routes/category')
, http = require('http')
, path = require('path')
, i18n = require('i18n')
, templatesDir   = path.join(__dirname, 'templates')
, emailTemplates = require('email-templates');

var moment = require('moment');

var mongoStore = require('connect-mongo')(express);
//var mongoStore = require('connect-mongodb');

var ObjectID = require('mongodb').ObjectID;

// Passport
var passport = require('passport')
, LocalStrategy = require('passport-local').Strategy;

function findById(id, fn) {
    mongo(function(db) {
        db.collection('users', function(err, collection) {
            collection.findOne(
                {
                    _id: new ObjectID(id),
                },
                function(err, user) {
                    if (user) {
                        user.id = user._id.toString();
                        return fn(null, user);
                    } else {
                        return fn(null, null);
                        //return fn(new Error('User ' + id + ' does not exist (findById)'), null);
                    }
                }
            );
        });
    });
}

function findByUsername(username, password, fn) {
    
    var cipher = crypto.createCipher('aes-256-cbc', config.auth_secret);
    var password_encrypted = cipher.update(password, 'utf8','hex') + cipher.final('hex');
    
    mongo(function(db) {
        db.collection('users', function(err, collection) {
            
            collection.findOne(
                {
                    email: username,
                    password_encrypted: password_encrypted
                },
                function(err, user) {
                    if (user) {
                        user.id = user._id.toString();
                        return fn(null, user);
                    } else {
                        return fn(null, null);
                    }
                }
            );
        });
    });
    
}

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    function(username, password, done) {
		
		
        process.nextTick(function () {
            
            findByUsername(username, password, function(err, user) {
                
                if (err) { return done(err); }
                
                if (!user) { 
					return done(null, false, { message: 'Unknown user ' + username }); 
				}
                
                if (user.password != password) {
					return done(null, false, { message: 'Invalid password' }); 
				}
                
                return done(null, user);
                
            })
        });
    }
));

i18n.configure({
    locales: ['en', 'ja'],
    directory: './locales'
});
//  updateFiles: true


var app = express();

app.locals({
    __: i18n.__
});

// all environments
app.set('port', process.env.PORT || config.nodeport);
app.set('views', __dirname + '/views');

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');

app.use(express.favicon());

express.logger.token('date2', function(req, res) {
    return moment().format('YYYY-MM-DD HH:mm:ss');
});

app.use(express.logger(':date2 :status :method :url HTTP/:http-version :referrer :user-agent'));
app.use(express.compress());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('alseia9s87e6afaKHDKSIUfqwelkja'));

app.use(express.session({
    store: new mongoStore({ 
        host: config.mongohost,
        db: config.database,
    }),
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(i18n.init);
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.enable('trust proxy');

console.log('app.js locale: ' + i18n.getLocale());

app.all('*', function(req, res, next) {
    
    if (req.isAuthenticated()) {
        if (req.user.hasOwnProperty('period')) {
            
            var now = moment();
            var exp = moment(req.user.period.end);
            
            if (now <= exp) {
                req.user.expired = false;
            } else {
                req.user.expired = true;
                if (req.user.status == 'trial') {
                    req.user.expiredmessage = 'Your free trial period is over.';
                }
            }
            
        }
        
        if (req.cookies.hasOwnProperty('admin')) {
            req.user.isadmin = true;
        } else {
            req.user.isadmin = false;
        }
    }
    
    if (!req.cookies.hasOwnProperty('admin')
        && req.headers['x-forwarded-for'] != '54.199.194.51'
        && req.headers['x-forwarded-for'] != '202.162.148.87'
        && req.isAuthenticated()) {
        
        var now = moment();
        
        mongo(function(db) {
            db.collection('users', function(err, collection) {
                
                collection.update(
                    {
                        _id: req.user._id,
                    },
                    {
                        $set: {
                            lastused_at: now._d
                        }
                    }
                ); // update
                
            }); // collection
        }); // mongo
        
    }
    
    next();
});

app.get('/', function(req, res) {
    
    if (req.isAuthenticated()) {
        
        index.list(req, res);
        
    } else {
        
        routes.index(req, res);
        
    }
    
});

app.get('/signup_confirm', index.signup_confirm);
app.get('/reset_password', index.reset_password);
app.get('/cancelaccount',  index.cancelaccount);
app.get('/accept',         index.accept);

app.post('/receivenotify', index.receivenotify);

app.get('/terms', function(req, res) {
    res.render('terms-of-service.ejs');
});
app.get('/privacy', function(req, res) {
    res.render('privacy.ejs');
});

//app.get('/users', user.list);

app.get('/admin',             admin.index);
app.get('/admin/index2',      admin.index2);
app.get('/admin/signin',      admin.signin);
app.get('/admin/listeditems', admin.listeditems);
app.get('/admin/test',        admin.test);
app.get('/admin/unanswered',  admin.unanswered);
app.get('/admin/sendinformationmail',  admin.sendinformationmail);
app.post('/admin/callapi',    admin.callapi);

app.get('/admin/update-period', function(req, res) {
    res.redirect('/admin/');
    
    mongo(function(db) {
        db.collection('users', function(err, collection) {
            
            collection.find(
                {
                    email: 'demo@listers.in'
                }
            ).toArray(function(err, docs) {
                
                docs.forEach(function(doc) {
                    
                    end = moment('2020-12-31 00:00:00');
                    
                    collection.update(
                        {
                            email: doc.email
                        },
                        {
                            $set: {
                                period: {
                                    start: moment(doc.created_at)._d,
                                    end: end._d
                                }
                            }
                        }
                    );
                    
                });
                
            });
        });
    });
});


app.get('/user/items', user.items);
app.get('/image', image.index);

app.post('/paypalipn',    index.paypalipn);
app.get('/paypalreturn', index.paypalreturn);

app.post('/file/upload',    file.upload);
app.post('/file/csvupload', file.csvupload);

app.post('/json/signup',        json.signup);
app.post('/json/forgotpassword', json.forgotpassword);
app.post('/json/resetpassword', json.resetpassword);
app.post('/json/items',         json.items);
app.post('/json/item',          json.item);
app.post('/json/addaccount',    json.addaccount);
app.post('/json/removeaccount', json.removeaccount);
app.post('/json/save',          json.save);
app.post('/json/delete',        json.delete);
app.post('/json/copy',          json.copy);
app.post('/json/end',           json.end);
app.post('/json/relist',        json.relist);
app.post('/json/revise',        json.revise);
app.post('/json/verifyadditem', json.verifyadditem);
app.post('/json/add',           json.add);
app.post('/json/import',        json.import);
app.post('/json/import_java',   json.import_java);
app.post('/json/updatesyncmode',    json.updatesyncmode);
app.post('/json/updatereceiveinfo', json.updatereceiveinfo);
app.post('/json/savedebugjson', json.savedebugjson);
app.post('/json/refresh',       json.refresh);
app.post('/json/userlog',       json.userlog);
app.post('/json/settings',      json.settings);
app.post('/json/findproducts',  json.findproducts);
app.post('/json/dismissmessage', json.dismissmessage);
app.post('/json/addmembermessagertq', json.addmembermessagertq);
app.post('/json/addsecondchanceitem', json.addsecondchanceitem);
app.post('/json/send-transaction-message', json.send_transaction_message);

app.get('/json/descriptiontemplate', json.descriptiontemplate);
app.get('/json/site',           json.site);
app.get('/json/gc2',            json.gc2);
app.get('/json/summary',        json.summary);

app.get('/category/childcategories', category.childcategories);

/*
  app.post('/login', passport.authenticate('local', {successRedirect: '/',
  failureRedirect: '/',
  failureFlash: false }));
*/

app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { 
            return next(err); 
        }
        if (!user) {
            return res.redirect('/'); 
        }
        req.logIn(user, function(err) {
            if (err) { 
                return next(err); 
            }
            
            /* save user access log */
            if (!req.cookies.hasOwnProperty('admin')) {
                mongo(function(db) {
                    db.collection('userlog.' + req.user._id, function(err, collection) {
                        collection.insert(
                            {
                                created_at: moment()._d,
                                action: 'Sign in',
                                ip: req.ip,
                                useragent: req.headers['user-agent']
                            }
                        );
                    }); // collection
                }); // mongo
            }
            
            return res.redirect('/');
        });
    })(req, res, next);
});


app.get('/javalogin', function(req, res) {
    res.render('javalogin', {
        user: req.user
    })
});

app.get('/logout', function(req, res) {
    
    if (req.isAuthenticated()) {
        
        if (!req.cookies.hasOwnProperty('admin')) {
            /* save user access log */
            mongo(function(db) {
                db.collection('userlog.' + req.user._id, function(err, collection) {
                    collection.insert(
                        {
                            created_at: moment()._d,
                            action: 'Sign out',
                            ip: req.ip,
                            useragent: req.headers['user-agent']
                        }
                    );
                }); // collection
            }); // mongo
        }
    }
    
    req.logout();
    
    res.redirect('/');
});

/* backbone.js request */
app.get('/user/list', index.list);

app.get('/json/summaries', json.summary_backbone);


/* read */
app.get('/json/items/:id', function(req, res) {
    req.body.id = req.params.id;
    json.item(req, res);
});

/* save */
//app.put('/json/items/:id', json.save_backbone);
app.put('/json/items/:id', json.save);

app.post('/rest/items', function(req, res) {
    console.dir(req.body);
    res.json({});
});

app.put('/rest/items', function(req, res) {
    console.dir(req.body);
    res.json({});
});


http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/node/')
}

