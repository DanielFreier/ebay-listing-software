db.users.find(
  {
    period: {
      $exists: false
    }
  }
).forEach(function(doc) {
  
  doc.period = {
    start: doc.created_at
  };
  
  db.users.save(doc);
});
