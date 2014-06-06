package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

public class GetCategorySpecifics extends ApiCall {

  private String targetsite;
	
	public GetCategorySpecifics() throws Exception {
    targetsite = "";
	}
	
  public GetCategorySpecifics(String[] args) throws Exception {
    targetsite = args[0];
  }
  
	public String call() throws Exception {
    
		DBObject row = db.getCollection("US.eBayDetails")
      .findOne(null, new BasicDBObject("SiteDetails", 1));
		BasicDBList sitedetails = (BasicDBList) row.get("SiteDetails");
		for (Object sitedbo : sitedetails) {
			
			String  site   = ((BasicDBObject) sitedbo).getString("Site");
			Integer siteid = Integer.parseInt(((BasicDBObject) sitedbo).getString("SiteID"));
      
      if (targetsite != "" && !site.equals(targetsite)) continue;
      
			log("GetCategorySpecifics:"+site);
      
      String savedir = basedir+"/logs/apicall/downloadFile";
      if ((new File(savedir+"/"+site+".xml")).exists()) {
        log("call downloadFile.callback(" + site + ")");
        downloadFile dlf = new downloadFile();
        dlf.callback(site);
        continue;
      }
      
			BasicDBObject reqdbo = new BasicDBObject();
			reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", admintoken));
			reqdbo.append("WarningLevel", "High");
			reqdbo.append("DetailLevel", "ReturnAll");
			reqdbo.append("CategorySpecificsFileInfo", "true");
			reqdbo.append("MessageID", site);
			
			String xml = convertDBObject2XML(reqdbo, "GetCategorySpecifics");
      
			Future<String> future = pool18.submit(new ApiCallTask(siteid, xml, "GetCategorySpecifics"));
			future.get();
		}
    
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
    
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		String site = resdbo.getString("CorrelationID");
		writelog("GetCategorySpecifics/"+site+".xml", responsexml);
		
		String taskid = resdbo.getString("TaskReferenceID");
		String fileid = resdbo.getString("FileReferenceID");
		
		/* call downloadFile api */
		BasicDBObject reqdbo = new BasicDBObject();
		reqdbo.append("taskReferenceId", taskid);
		reqdbo.append("fileReferenceId", fileid);
		
		JSONObject jso = JSONObject.fromObject(reqdbo.toString());
		XMLSerializer xmls = new XMLSerializer();
		xmls.setObjectName("downloadFileRequest");
		xmls.setNamespace(null, "http://www.ebay.com/marketplace/services");
		xmls.setTypeHintsEnabled(false);
		String requestxml = xmls.write(jso);
    
		Future<String> future = pool18.submit(new ApiCallTask2(0, requestxml, "downloadFile", site));
		future.get();
		
		return "";
	}
}
