var mongo  = require('../routes/mongoconnect');

exports.childcategories = function(req, res) {
  
  var url = require('url');
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;
  var site = query.site;
  
  var query = {};
  if (query.hasOwnProperty('categoryid')) {
    query.CategoryParentID = categoryid;
  } else {
    query.CategoryLevel = '1';
  }
  
  mongo(function(db) {
    db.collection(site + '.Categories', function(err, coll) {
      coll.find(query).sort({_id: 1}).toArray(function(err, docs) {
        res.json(docs);
      });
    });
  });  
  
}
