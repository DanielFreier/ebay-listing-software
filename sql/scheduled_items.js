db.users.find().forEach(
  
  function(row) {
    
    if (row.email != 'cptechworld@gmail.com') return;
    
    db.getCollection('items.' + row._id).find(
      {
        'opt.ScheduleTime': {
          $exists: true
        }
      },
      {
        _id: false,
        'opt.ScheduleTime': true,
        'org.SellingStatus.ListingStatus': true
      }
    ).forEach(printjson);
    
  }
  
  
);
