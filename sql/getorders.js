/* Each Users */
db.users.find().forEach(
  
  function(row) {
    
    var email = row.email;
    
    /* Each eBay IDs */
    for (idx in row.userids2) {
      
      var user = row.userids2[idx];
      
      print('/var/www/listers.in/shells/callapi.sh GetOrders'
            + ' ' + email
            + ' ' + user.username);
      
    }
  }
);
