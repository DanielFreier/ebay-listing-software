/* Each Users */
db.users.find(
).forEach(
  
  function(row) {
    
    var email = row.email;
    
    /* Aggregate */
		var result = db['items.' + row._id].aggregate([
      {
        $match: {
          'org.SellingStatus.ListingStatus': 'Active'
        }
      },
      {
        $group: {
          _id: '$org.ListingType',
          items: {
            $sum: 1
          },
        }
      }
    ]);
		
    print(email);
    printjson(result.result);
    
  }
);
