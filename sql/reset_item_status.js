db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('items.') == 0) {
      
			print(coll);
      
      db[coll].find({'status':{'$exists':1}},{'status':1}).forEach(printjson);
      db[coll].update({'status':{'$exists':1}},{'$set':{'status':''}}, false, true);
		}
	}
);
