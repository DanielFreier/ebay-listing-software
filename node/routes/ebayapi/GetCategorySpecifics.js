var mongo      = require('../mongoconnect');
var taskmodule = require('./task');
var config     = require('../../config');
var async      = require('async');
var clone      = require('clone');
var fs         = require('fs');

module.exports = {
  
  call: function(request, callback) {
    
    console.log('GetCategorySpecifics');
    
    async.waterfall([
      
      function(callback) {
        taskmodule.getnewtokenmap('admin@listers.in', callback);
      },
      
      function(token, callback) {
        
        mongo(function(db) {
          
          db.collection('US.eBayDetails', function(err, collection) {
            
            collection.findOne({}, function(err, document) {
              
              document.SiteDetails.forEach(function(doc) {
                
                //if (doc.Site != 'US') return;
                
                var requestjson = {
                  email: 'admin@listers.in',
                  callname: 'GetCategorySpecifics',
                  site: doc.Site,
                  siteid: doc.SiteID,
                  params: {
                    RequesterCredentials: {
                      eBayAuthToken: config.admintoken
                    },
                    WarningLevel: 'High',
                    DetailLevel: 'ReturnAll',
                    CategorySpecificsFileInfo: 'true',
                    MessageID: token + ' ' + doc.Site
                  }
                };
                
                var logdir = '/var/www/sandbox.listers.in/logs/apicall/downloadFile';
                var xmlfile = logdir + '/' + requestjson.email + '_' + requestjson.site + '.xml';
                var jsonfile = logdir + '/' + requestjson.email + '_' + requestjson.site + '.json';
                
                /* xml -> mongodb */
                if (fs.existsSync(xmlfile)) {
                  console.log('exists: ' + xmlfile);
                  
                  /* xml -> json */
                  var xml2js = require('xml2js');
                  var parser = xml2js.Parser({
                    attrkey: '@',
                    charkey: '#text',
                    explicitArray: false
                  });
                  
                  /* return to callback */
                  var xmlstr = fs.readFileSync(xmlfile);
                  parser.parseString(xmlstr, function (err, resultjson) {
                    fs.writeFile(jsonfile, resultjson);
                  });
                  
                  return;
                }
                
                taskmodule.addqueue(requestjson, function(err, resultjson) {
                  
                  var correlationid = resultjson.CorrelationID.split(' ');
                  var site = correlationid[1];
                  
                  var requestjson2 = {
                    email: 'admin@listers.in',
                    callname: 'downloadFile',
                    site: doc.Site,
                    siteid: doc.SiteID,
                    params: {
                      fileReferenceId: resultjson.FileReferenceID,
                      taskReferenceId: resultjson.TaskReferenceID
                    }
                  };
                  
                  taskmodule.addqueue(requestjson2, function(err, resultjson2) {
                    
                    var unzip = require('unzip');
                    var zip = fs.createReadStream(resultjson2.zipfile);
                    var xml = fs.createWriteStream(resultjson2.zipfile.replace(/\.zip$/, '.xml'));
                    
                    zip.pipe(unzip.Parse())
                      .on('entry', function (entry) {
                        if (entry.path.match(/\.xml$/)) {
                          entry.pipe(xml);
                        } else {
                          entry.autodrain();
                        }
                      });
                    
                  });
                  
                });
                
              }); // forEach
              
            }); // findOne
            
          }); // collection
          
        }); // mongo
        
        callback(null, '');
      },
      
    ], function(err, result) {
      
      callback(null, result);
      
    }); // async.waterfall
    
  } // call
  
}
