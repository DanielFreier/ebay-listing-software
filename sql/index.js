/*
  todo: CategoryMapping:oldID
  todo: DescriptionTemplates.DescriptionTemplate.ID
*/

db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('items') == 0) {
			
			print('indexing ' + coll + ' (' + db[coll].count() + ' records)');
			
			/*
			var idxs = db[coll].getIndexes();
			for (var i=0; i<idxs.length; i++) {
				if (idxs[i].name == '_id_') continue;
				db[coll].dropIndex(idxs[i].name);
			}
			*/
			
			db[coll].ensureIndex({'org.ItemID':1});
			db[coll].ensureIndex({'UserID':1});
			db[coll].ensureIndex({'org.SellingStatus.BidCount':1});
			db[coll].ensureIndex({'org.SellingStatus.ListingStatus':1});
			db[coll].ensureIndex({'org.SellingStatus.QuantitySold':1});
			db[coll].ensureIndex({'org.ListingDetails.EndTime':1});
			db[coll].ensureIndex({'membermessages.MessageStatus':1});
			db[coll].ensureIndex({'statustags':1});
			db[coll].ensureIndex({'opt.template':1});
      
			db[coll].ensureIndex(
        {
          'UserID': 1,
          'org.SellingStatus.ListingStatus': 1,
          'org.ListingDetails.EndTime': 1
        }
      );
      
			db[coll].ensureIndex(
        {
          'mod.ScheduleTime': 1,
          'opt.ScheduleTime': 1,
          'org.ListingDetails.StartTime': 1
        }
      );
		}
	}
);

db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('Categories') > 0) {
			print('indexing '+coll+' ('+db[coll].count()+' records)');
			db[coll].ensureIndex({CategoryParentID:1});
			db[coll].ensureIndex({CategoryLevel:1});
			db[coll].ensureIndex({CategoryID:1});
		}
	}
);

db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('CategorySpecifics') > 0) {
			print('indexing '+coll+' ('+db[coll].count()+' records)');
			db[coll].ensureIndex({CategoryID:1});
		}
	}
);

db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('CategoryFeatures.Category') > 0) {
			print('indexing '+coll+' ('+db[coll].count()+' records)');
			db[coll].ensureIndex({CategoryID:1});
		}
	}
);

db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('Category2CS') > 0) {
			print('indexing '+coll+' ('+db[coll].count()+' records)');
			db[coll].ensureIndex({CategoryID:1});
		}
	}
);

db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('DescriptionTemplates.DescriptionTemplate') > 0) {
			print('indexing '+coll+' ('+db[coll].count()+' records)');
			db[coll].ensureIndex({ID:1});
		}
	}
);

db.getCollectionNames().forEach(
	function(coll) {
		if (coll.indexOf('DescriptionTemplates.ThemeGroup') > 0) {
			print('indexing '+coll+' ('+db[coll].count()+' records)');
			db[coll].ensureIndex({GroupID:1});
		}
	}
);
