package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;

public class GetCategory2CS extends ApiCall {
	
	public GetCategory2CS() throws Exception {
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
			reqdbo.append("MessageID",    site);
			
			String requestxml = convertDBObject2XML(reqdbo, "GetCategory2CS");
			pool18.submit(new ApiCallTask(siteid, requestxml, "GetCategory2CS"));
		}
		
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		String site = resdbo.getString("CorrelationID");
		if (site == null) {
			site = "US";
		}
		writelog("GetCategory2CS/"+site+".xml", responsexml);
		
		DBCollection coll = db.getCollection(site+".Category2CS.Category");
		if (db.collectionExists(site+".Category2CS.Category")) {
			coll.drop();
		}
		coll.insert((List<DBObject>) ((BasicDBObject) resdbo.get("MappedCategoryArray")).get("Category"));
		
		return "";
	}
}
