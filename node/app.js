/**
 * Module dependencies.
 */

var config = require('./config');

var mongo = require('./routes/mongoconnect');

var express = require('express')
  , routes = require('./routes')
  , user   = require('./routes/user')
  , json   = require('./routes/json')
  , admin  = require('./routes/admin')
  , image  = require('./routes/image')
  , index  = require('./routes/index')
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
app.set('port', process.env.PORT || 3000);
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
    host: '10.156.17.98',
    db: 'ebay' 
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

app.get('/', routes.index);

app.post('/receivenotify', index.receivenotify);

//app.get('/users', user.list);

app.get('/admin',             admin.index);
app.get('/admin/signin',      admin.signin);
app.get('/admin/listeditems', admin.listeditems);
app.get('/admin/unanswered',  admin.unanswered);
app.post('/admin/callapi',    admin.callapi);

app.get('/user/items', user.items);
app.get('/image', image.index);

app.post('/json/items',         json.items);
app.post('/json/item',          json.item);
app.post('/json/addaccount',    json.addaccount);
app.post('/json/removeaccount', json.removeaccount);
app.post('/json/delete',        json.delete);
app.post('/json/copy',          json.copy);
app.post('/json/end',           json.end);
app.post('/json/relist',        json.relist);
app.post('/json/savedebugjson', json.savedebugjson);
app.post('/json/refresh',       json.refresh);
app.post('/json/settings',      json.settings);
app.post('/json/dismissmessage', json.dismissmessage);

app.get('/json/import',         json.import);
app.get('/json/site',           json.site);
app.get('/json/gc2',            json.gc2);
app.get('/json/summary',        json.summary);

app.get('/signup_confirm', index.signup_confirm);

app.post('/login', passport.authenticate('local', {successRedirect: '/node/javalogin',
                                                   failureRedirect: '/',
                                                   failureFlash: false }));

app.get('/javalogin', function(req, res) {
  
  res.render('javalogin', {
    user: req.user
  })
  
});


app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/page/logout');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/node/')
}
