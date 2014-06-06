package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class GetCategoryFeatures extends ApiCall {
	
	public GetCategoryFeatures() throws Exception {
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
			reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", admintoken));
			reqdbo.append("WarningLevel", "High");
			reqdbo.append("DetailLevel",  "ReturnAll");
			reqdbo.append("ViewAllNodes", "true");
			reqdbo.append("MessageID",    site);
			
			String requestxml = convertDBObject2XML(reqdbo, "GetCategoryFeatures");
			Future<String> future = pool18.submit
				(new ApiCallTask(siteid, requestxml, "GetCategoryFeatures", "filename"));
			
			future.get();
		}
		
		return "";
	}
	
	public String callback(String filename) throws Exception {
		
		String responsexml = readfile(filename);
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		String site = resdbo.getString("CorrelationID");
		writelog("GetCategoryFeatures/"+site+".xml", responsexml);
		
		DBCollection coll2 = db.getCollection(site+".CategoryFeatures.Category");
		coll2.drop();
		coll2.insert((List<DBObject>) resdbo.get("Category"));
		
		DBCollection coll1 = db.getCollection(site+".CategoryFeatures");
		if (db.collectionExists(site+".CategoryFeatures")) {
			coll1.drop();
		}
		
		resdbo.removeField("Category");
		coll1.insert(resdbo);
		
		return "";
	}
}
