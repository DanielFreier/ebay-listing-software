db.tokenmap
  .find({
    
  })
  .sort({
    _id: -1
  })
  .limit(10)
  .forEach(printjson);
