db.getCollectionNames().forEach(
	function(coll) {
    
    if (!coll.match(/ready$/)) return;
    
		print(coll);
    
    var collname = coll.replace(/\.ready$/, '');
    db.getCollection(coll).renameCollection(collname, true);
    
    
    //db.getCollection(coll).drop();
    
	}
);
