/* Each Users */
var now = new Date();

print(now);

db.users.find().forEach(
  
  function(row) {
    
    if (row.email != 'cptechworld@gmail.com'
        && row.email != 'mankindinfo@hotmail.com'
        && row.email != 'selax77@gmail.com') return;
      
    var _id = row._id;
    _id = _id.toString();
    _id = _id.replace('"', '');
    _id = _id.replace('"', '');
    _id = _id.replace('ObjectId(', '');
    _id = _id.replace(')', '');
    
    db.getCollection('items.' + _id).find(
      {
        'status': {
          '$exists': 1
        }
      },
      {
        'status': 1
      }
    ).forEach(printjson);
    
    db.getCollection('items.' + _id).update(
      {
        'status': {
          '$exists': 1
        }
      },
      {
        '$set': {
          'status': ''
        }
      }, 
      false, 
      true
    );
  }
);
