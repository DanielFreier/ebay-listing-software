var now = new Date();

db.users.find({
  
  //email: 'thtech2010@gmail.com'
  email: 'disco_fabietto83@hotmail.it'
  
}).forEach(
  
  function(row) {
    
    print(row.email);
    
    var _id = row._id;
    _id = _id.toString();
    _id = _id.replace('"', '');
    _id = _id.replace('"', '');
    _id = _id.replace('ObjectId(', '');
    _id = _id.replace(')', '');
    
		var result = db.getCollection('items.' + _id).aggregate([
      {
        $project: {
          _id:     0,
          userid:  "$UserID",
					status:  "$org.SellingStatus.ListingStatus",
          sold:    "$org.SellingStatus.QuantitySold",
          //msg:     {$elemMatch: "$membermessages.MessageStatus"
        },
      },
      {
        $group: {
          _id:    "$userid",
          
          items:  {$sum: 1},
          
          active: {$sum: {$cond: [{$eq:  ["$status", 'Active']}, 1, 0]}},
          
          sold:   {$sum: {$cond: [{$gte: ["$sold", 1]}, 1, 0]}},
          
          unsold: {$sum: {$cond: [{$and: [{$eq: ["$sold", 0]},
                                          {$eq: ["$status", "Completed"]}]}, 1, 0]}},
          
          unanswered: {$sum: "$msg"},
          
          saved:  {$sum: {$ifNull: ["$status", 1]}}
        }
      }
    ]);
    
    printjson(result);
  }
);
