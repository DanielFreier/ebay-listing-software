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
                
                if (doc.Site != 'US') return;
                
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
                
                var logdir = '/var/www/listers.in/logs/apicall/downloadFile';
                var xmlfile = logdir + '/' + requestjson.email + '_' + requestjson.site + '.xml';
                
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
                  
                  var input = fs.createReadStream(xmlfile, {encoding: 'utf8'});
                  
                  var xmlstr = '';
                  
                  input.on('data', function(data) {
                    
                    xmlstr += data.toString();
                    xmlstr = xmlstr.replace(/\n/g, '');
                    xmlstr = xmlstr.replace(/^.+?<\/Build>/, '');
                    
                    while (xmlstr.match(/<Recommendations>.+?<\/Recommendations>/)) {
                      
                      var chunk = xmlstr.replace(/^.+(<Recommendations>.+?<\/Recommendations>).+$/, 
                                                 '$1');
                      //console.log('chunk: ' + chunk);
                      
                      parser.parseString(chunk, function (err, chunkjson) {
                        
                        //taskmodule.convertattr(chunkjson);
                        
                        db.collection(doc.Site + '.CategorySpecifics.ready', function(err, spcoll) {
                          spcoll.insert(chunkjson.Recommendations);
                        })
                      });
                      
                      xmlstr = xmlstr.replace(chunk, '');
                    }
                    
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
                    
                    console.log(doc.Site + '=======================');
                    console.dir(err);
                    console.dir(resultjson2);
                    
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
