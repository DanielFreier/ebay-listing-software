/**
 * Module dependencies.
 */

var config = require('./config');

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
  
  mongo(function(db) {
    db.collection('users', function(err, collection) {
      
      collection.findOne(
        {
          'email': username,
          'password': password
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




console.log('app.js locale: ' + i18n.getLocale());

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.all('*', function(req, res, next) {
  
  if (!req.cookies.hasOwnProperty('admin') && req.isAuthenticated()) {
    
    mongo(function(db) {
      db.collection('users', function(err, collection) {
        collection.findOne(
          {
            _id: req.user._id,
          },
          function(err, user) {
            
            var now = new Date();
            
            collection.update(
              {
                _id: req.user._id,
              },
              {
                $set: {
                  lastused_at: now
                }
              }
            );
          }
        );
      });
    });
    
  }
  
  next();
});

app.get('/', function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  var newlook = 0;
  
  if (req.cookies.hasOwnProperty('admin')) {
    
    if (query.hasOwnProperty('newlook')) {
      newlook = query.newlook;
      res.cookie('newlook', newlook, {maxAge: 86400*365});
    } else if (req.cookies.hasOwnProperty('newlook')) {
      newlook = req.cookies.newlook;
    }
    
  } else {
    
    if (query.hasOwnProperty('newlook')) {
      
      newlook = query.newlook;
      
      mongo(function(db) {
        db.collection('users', function(err, collection) {
          collection.findOne(
            {
              _id: req.user._id,
            },
            function(err, user) {
              
              collection.update(
                {
                  _id: req.user._id,
                },
                {
                  $set: {
                    newlook: newlook
                  }
                },
                {
                  safe: true
                },
                function(err) {
                  res.redirect('/');
                }
              );
            }
          ); // findOne
        }); // collection
      }); // mongo
      
      return;
      
    } else if (req.isAuthenticated() && req.user.hasOwnProperty('newlook')) {
      
      newlook = req.user.newlook;
      
    }
  }
  
  if (newlook == 1 && req.isAuthenticated()) {
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

//app.get('/users', user.list);

app.get('/admin',             admin.index);
app.get('/admin/signin',      admin.signin);
app.get('/admin/listeditems', admin.listeditems);
app.get('/admin/unanswered',  admin.unanswered);
app.post('/admin/callapi',    admin.callapi);

app.get('/user/items', user.items);
app.get('/image', image.index);

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
app.post('/json/savedebugjson', json.savedebugjson);
app.post('/json/refresh',       json.refresh);
app.post('/json/settings',      json.settings);
app.post('/json/findproducts',  json.findproducts);
app.post('/json/dismissmessage', json.dismissmessage);
app.post('/json/addmembermessagertq', json.addmembermessagertq);

app.get('/json/descriptiontemplate', json.descriptiontemplate);
app.get('/json/site',           json.site);
app.get('/json/gc2',            json.gc2);
app.get('/json/summary',        json.summary);

app.get('/category/childcategories', category.childcategories);

//app.post('/login', passport.authenticate('local', {successRedirect: '/node/javalogin',
app.post('/login', passport.authenticate('local', {successRedirect: '/',
                                                   failureRedirect: '/',
                                                   failureFlash: false }));

app.get('/javalogin', function(req, res) {
  res.render('javalogin', {
    user: req.user
  })
});

app.get('/logout', function(req, res) {
  req.logout();
  //res.redirect('/page/logout');
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

