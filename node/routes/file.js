var mongo      = require('./mongoconnect');
var config     = require('../config');
var csv_tl     = require('../csv-turbolister');
var nodemailer = require('nodemailer');
var fs         = require('fs');
var async      = require('async');
var clone      = require('clone');
var moment     = require('moment');
var util       = require('util');
var csv        = require('csv');
var ObjectID   = require('mongodb').ObjectID;

exports.upload = function(req, res) {
  
  var id       = req.body.id;
  var userid   = req.body.userid
  var divclass = req.body.divclass
  
  var files = [];
  if (Array.isArray(req.files.fileUpload)) {
    files = req.files.fileUpload;
  } else {
    files.push(req.files.fileUpload);
  }
  
  var epsurls = [];
  var i = 0;
  async.whilst(
    
    function() {
      return i < files.length;
    },
    
    function(callback) {
      
      var file = files[i];
      
      console.log('file[' + i + ']: ' + file.name);
      
      var timestampstr = moment().format('YYYYMMDD_HHmmss');
      var extension = file.name.replace(/^.+\./, '');
      var tmpname = id + '_' + timestampstr + '_' + i + '.' + extension;
      
      var filedata = fs.readFileSync(file.path);
      fs.writeFileSync('/var/www/' + config.hostname + '/webroot/itemimage/' + tmpname, filedata);
      
      var args = [
        'UploadSiteHostedPictures',
        req.user.email,
        userid,
        'http://' + config.hostname + '/itemimage/' + tmpname
      ];
      
      writesocket(args, function(err, result) {
        var epsurl = result.replace(/^undefined/, '').replace(/\n/, '');
        epsurls.push(epsurl);
        i++;
        callback(null, null);
      });
    },
    
    function(err) {
      
      console.dir(epsurls);
      
      res.render('uploaded', {
        id: id,
        divclass: divclass,
        savedfilenames: epsurls
      });
      
    }
    
  ); // async.whilst
  
} // upload

exports.csvupload = function(req, res) {
  
  var savedir = '/var/www/' + config.hostname + '/data/uploaded';
  var user_id = req.user._id;
  var userid  = req.body.userid;
  var tmpname = '';
  
  var file = req.files.fileUpload;
  var timestampstr = moment().format('YYYYMMDD_HHmmss');
  var extension = file.name.replace(/^.+\./, '');
  var tmpname = userid + '_' + timestampstr + '.' + extension;
  
  var filedata = fs.readFileSync(file.path);
  fs.writeFileSync(savedir + '/' + tmpname, filedata);
  
  /* parse csv file */
  csv()
    .from.path(savedir + '/' + tmpname)
    .to.array(function(data) {
      
      var colnames = [];
      for (var colidx = 0; colidx < data[0].length; colidx++) {
        colnames[colidx] = data[0][colidx];
      }
      
      for (var rowidx = 0; rowidx < data.length; rowidx++) {
        if (rowidx == 0) continue;
        
        var mod = {};
        
        for (var colidx = 0; colidx < data[rowidx].length; colidx++) {
          
          var colkey = csv_tl[colnames[colidx]];
          if (colkey == '' || colkey == undefined) continue;
          
          var colval = data[rowidx][colidx];
          
          var modref = mod;
          
          var arrkey = colkey.split('.');
          
          mod = putsub(mod, arrkey, colval);
          
          /*
          for (var keyidx = 0; keyidx < arrkey.length; arrkey++) {
            modref[arrkey[keyidx]] = {}
            modref = modref[arrkey[keyidx]];
          }
          modref = colval;
          */
        }
        console.log(JSON.stringify(mod, null, 2));
        
        var newid = ObjectID();
        
        var item = {
          _id: newid,
          mod: mod,
          UserID: userid
        };
        
        mongo(function(db) {
          db.collection('items.' + req.user._id, function(err, itemcoll) {
            itemcoll.insert(item);
          }); // collection
        }); // mongo
      }
    })
  
  res.render('csvuploaded', {});
  
} // csvupload

function writesocket(args, callback) {
  
  var data;
  
  var net = require('net');
  
  var socket = new net.Socket();
  
  socket.connect(config.daemonport, 'localhost');
  
  socket.on('connect', function() {
    socket.write(args.join("\n") + "\n", function(err, result) {
      socket.end();
    });
  });
  
  socket.on('data', function(chunkdata) {
    data += chunkdata.toString();
  });
  
  socket.on('end', function(err, result) {
    callback(null, data);
  });
  
} // writesocket

function putsub(o, orgpath, val) {
  
  path = clone(orgpath);
  console.log(path.join(' | ') + ' : ' + val);
  
  if (path.length == 1) {
    
    if (path[0] == '') return;
    
    if (path[0].match(/^[0-9]$/)) {
      path[0] = parseInt(path[0]) - 1;
    }
    
    o[path[0]] = val;
    
  } else {
    
    var tmppath = path.shift();
    
    if (tmppath.match(/^[0-9]$/)) {
      tmppath = parseInt(tmppath);
    }
    
    if (path[0].match(/^[0-9]$/)) {
      if (!Array.isArray(o[tmppath])) {
        o[tmppath] = [];
      }
    } else {
      if (o[tmppath] == null) {
        o[tmppath] = {};
      }
    }
    
    putsub(o[tmppath], path, val);
  }
  
  return o;
  
} // putsub
