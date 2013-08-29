db.listeditems.drop();

db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('items.') != 0) return;
    
    print(coll);
    
    db[coll].find(
      {
        'org.Description': /listersin-banner/
      },
      {
        'org.ItemID' : true,
        'org.Title': true,
        'org.Seller.UserID': true,
        'org.ListingDetails.ViewItemURL': true,
        'org.ListingDetails.StartTime': true,
        'org.ListingDetails.EndTime': true,
        'org.SellingStatus.ListingStatus': true
      }
    ).forEach(function(row) {
      
      db.listeditems.update(
        {
          _id: row.org.ItemID
        },
        {
          _id:       row.org.ItemID,
          title:     row.org.Title,
          userid:    row.org.Seller.UserID,
          url:       row.org.ListingDetails.ViewItemURL,
          starttime: row.org.ListingDetails.StartTime,
          endtime:   row.org.ListingDetails.EndTime,
          status:    row.org.SellingStatus.ListingStatus
        },
        true
      );
      
    });
    
	}
);
