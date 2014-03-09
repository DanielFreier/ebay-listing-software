db.users.find({
  
  email: 'disco_fabietto83@hotmail.it'
  
}).forEach(
  
  function(row) {
    
    print(row._id);
    
    var tags = db.getCollection('items.' + row._id).aggregate(
      {
        $unwind: "$statustags"
      },
      {
        $group: {
          _id: "$statustags",
          count: {
            $sum: 1 
          }
        }
      }
    );
    
    printjson(tags);
  }
);
