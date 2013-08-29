db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('items.') != 0) return;
    
    db[coll].find(
      {
        'membermessages.CreationDate': /^2013/
      },
      {
        'membermessages.CreationDate': true
      }
    ).forEach(printjson);
    
	}
);
