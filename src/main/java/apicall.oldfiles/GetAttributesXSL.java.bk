package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import org.apache.commons.codec.binary.Base64;

public class GetAttributesXSL extends ApiCall {
	
	private String productid;
	
	public GetAttributesXSL() throws Exception {
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
			
			String requestxml = convertDBObject2XML(reqdbo, "GetAttributesXSL");
			Future<String> future =
				pool18.submit(new ApiCallTask(siteid, requestxml, "GetAttributesXSL", "filename"));
			future.get();
		}
		
		return "";
	}
	
	public String callback(String filename) throws Exception {
		
		String responsexml = readfile(filename);
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		String site = resdbo.getString("CorrelationID");
		if (site == null) {
			site = "US";
		}
		writelog("GetAttributesXSL/"+site+".xml", responsexml);
		
		String data     = ((BasicDBObject) resdbo.get("XSLFile")).getString("FileContent");
		String xslfilename = ((BasicDBObject) resdbo.get("XSLFile")).getString("FileName");
		
		String decoded = new String(Base64.decodeBase64(data));
		
		writelog("GetAttributesXSL/"+site+"."+xslfilename, decoded);
		
		return "";
	}
}
