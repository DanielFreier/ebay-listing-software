/* Each Users */
var now = new Date();

print(now);

db.users.find().forEach(
  
  function(row) {
    
    //if (row.email != 'Maxclinder@aol.com') return;
    //if (row.email != 'cptechworld@gmail.com') return;
    if (row.email != 'info@novaleeco.com') return;
    //if (row.email != 'demo@listers.in') return;
    
    var _id = row._id;
    _id = _id.toString();
    _id = _id.replace('"', '');
    _id = _id.replace('"', '');
    _id = _id.replace('ObjectId(', '');
    _id = _id.replace(')', '');
    //print(_id);
    
    //db.getCollection('items.' + _id).remove();
      
    db.getCollection('items.' + _id).find(
      {
        bids: {
          $exists: true
        }
      },
      {
        'bids.Quantity': true
      }
    ).forEach(printjson);
    
    //var now = new Date();
    
    /*
    var res = db.runCommand({
      count: 'items.' + _id,
      query: {
        'org.SellingStatus.ListingStatus': 'Active',
        'org.ListingDetails.EndTime': /^2013/
      }
    });
    
    printjson(res);
    */
    /*
    db.getCollection('items.' + _id).remove(
      {
        'org.SellingStatus.ListingStatus': 'Active',
        'org.ListingDetails.EndTime': /^2013/
      }
    );
    */
  }
);
