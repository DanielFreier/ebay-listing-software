/* Each Users */
db.users.find().forEach(
  
  function(row) {
    
    if (row.email != 'demo@listers.in') return;
    //if (row.email != 'cptechworld@gmail.com') return;
    //print(row.email);
    
    db.getCollection('userlog.' + row._id).find(
    ).forEach(printjson);
    
  }
);
