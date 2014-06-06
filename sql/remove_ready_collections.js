db.getCollectionNames().forEach(
	function(coll) {
        if (!coll.match(/ready$/)) return;
        
		print(coll);
        
        db.getCollection(coll).drop();
	}
);
