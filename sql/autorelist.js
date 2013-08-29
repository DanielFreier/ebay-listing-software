db.users.find().forEach(
  function(user) {
    
    db.getCollection('items.' + user._id).find(
      {
        'opt.AutoRelist': 'true'
      },
      {
        'opt': true,
        'org.Seller.UserID': true,
        'org.Title': true,
        'org.ListingDetails.EndTime': true
      }
    ).forEach(function(row) {
      
      print(user.email);
      printjson(row);
      
    });
    
  }
);
