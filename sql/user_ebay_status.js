db.users.find(
  {
    
  },
  {
    'userids2.User.Status': true
  }
).forEach(printjson);
