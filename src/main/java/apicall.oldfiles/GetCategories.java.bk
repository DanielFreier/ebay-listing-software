package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class GetCategories extends ApiCall {
	
	public GetCategories() throws Exception {
	}
	
	public String call() throws Exception {
		
		DBObject row = db.getCollection("US.eBayDetails")
			.findOne(null, new BasicDBObject("SiteDetails", 1));
		BasicDBList sitedetails = (BasicDBList) row.get("SiteDetails");
		for (Object sitedbo : sitedetails) {
			
			String  site   = ((BasicDBObject) sitedbo).getString("Site");
			Integer siteid = Integer.parseInt(((BasicDBObject) sitedbo).getString("SiteID"));
			log(site);
			
			BasicDBObject reqdbo = new BasicDBObject();
			reqdbo.put("RequesterCredentials", new BasicDBObject("eBayAuthToken", admintoken));
			reqdbo.put("WarningLevel",   "High");
			reqdbo.put("DetailLevel",    "ReturnAll");
			reqdbo.put("CategorySiteID", siteid.toString());
			reqdbo.put("MessageID",      site);
			
			String requestxml = convertDBObject2XML(reqdbo, "GetCategories");
			Future<String> future =
				pool18.submit(new ApiCallTask(siteid, requestxml, "GetCategories", "filename"));
			future.get();
		}
		
		return "";
	}
	
	public String callback(String filename) throws Exception {
		
		String responsexml = readfile(filename);
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		
		String site = resdbo.getString("CorrelationID");
		writelog("GetCategories/"+site+".xml", responsexml);
		
		DBCollection coll = db.getCollection(site+".Categories");
		if (db.collectionExists(site+".Categories")) {
			coll.drop();
		}
		
		coll.insert((List<DBObject>) ((BasicDBObject) resdbo.get("CategoryArray")).get("Category"));
		
		return "";
	}
}
