var querystring = require('querystring'); 
var https = require('https');
var clone = require('clone');

var args = clone(process.argv);

args.splice(0, 2);

console.dir(args);

var postjson = {
  callname: args[0]
};

/*
var postjson = {
  callname: 'GetMemberMessages',
  email: 'fd3s.boost@gmail.com',
  userid: 'testuser_hal',
  StartCreationTime: '2013-01-01',
  EndCreationTime: '2013-04-01'
};
*/

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
