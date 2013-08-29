exports.index = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  
  var orgurl = query.url;
  
  var host = orgurl.replace(/^http:\/\//, '').replace(/\/.+$/, '');
  
  var http = require('http');
  
  http.get({
    host: 'localhost',
    port: 8585,
    path: orgurl,
    headers: {
      Host: host
    }
  }, function(imgres) {
    
    imgres.on('data', function (chunk) {
      res.write(chunk);
    });
    
    imgres.on('end', function (chunk) {
      res.end();
    });
    
  });
  
};
