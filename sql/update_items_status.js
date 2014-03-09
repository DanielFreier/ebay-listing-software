var now = new Date();

db.users.find({
  
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
    
    /* Scheduled */
    db.getCollection('items.' + _id).update(
      {
        $or: [
          {'mod.ScheduleTime': {$gt: now}},
          {'opt.ScheduleTime': {$gt: now}},
          {'org.ListingDetails.StartTime': {$gt: now}}
        ]
      },
      {$addToSet: {statustags: 'scheduled'}},
      {multi: true}
    );
    
    /* Active */
    db.getCollection('items.' + _id).update(
      {'org.SellingStatus.ListingStatus': 'Active'},
      {$addToSet: {statustags: 'active'}},
      {multi: true}
    );
    
    /* Sold */
    db.getCollection('items.' + _id).update(
      {'org.SellingStatus.QuantitySold': {$gte: 1}},
      {$addToSet: {statustags: 'sold'}},
      {multi: true}
    );
    
    /* Unsold */
    db.getCollection('items.' + _id).update(
      {
        'org.SellingStatus.ListingStatus': 'Completed',
        'org.SellingStatus.QuantitySold': 0
      },
      {$addToSet: {statustags: 'unsold'}},
      {multi: true}
    );
    
    /* Unanswered */
    db.getCollection('items.' + _id).update(
      {'membermessages.MessageStatus': 'Unanswered'},
      {$addToSet: {statustags: 'unanswered'}},
      {multi: true}
    );
    
    /* Saved */
    db.getCollection('items.' + _id).update(
      {'org.ItemID': {$exists: false}},
      {$addToSet: {statustags: 'saved'}},
      {multi: true}
    );
    
  }
);
