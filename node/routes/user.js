var mongo = require('../routes/mongoconnect');

exports.items = function(req, res) {
  
  if (req.isAuthenticated()) {
    console.log('email: ' + req.user.email);
    console.log('_id: ' + req.user._id);
  } else {
    console.log('rest authenticated ? No');
  }
  
  mongo(function(db) {
    db.collection('items.' + req.user._id, function(err, collection) {
      collection.find(
        {},
        {
          'mod.Title': 1,
          'mod.StartPrice': 1
        }
      ).toArray(
        function(err, items) {
          res.json(items);
        }
      );
    });
  });
  
}
