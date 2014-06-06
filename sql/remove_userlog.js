db.getCollectionNames().forEach(
	function(coll) {
    
    if (!coll.match(/^userlog/)) return;
    
		print(coll);
    
    db.getCollection(coll).drop();
    
	}
);
