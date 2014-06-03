package ebaytool.apicall;

import com.mongodb.*;
import com.mongodb.util.*;

import java.io.*;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.*;

import javax.xml.parsers.*;
import javax.xml.transform.Source;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.*;
import javax.xml.XMLConstants;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

import org.bson.types.ObjectId;
import org.w3c.dom.*;
import org.xml.sax.SAXException;

public class VerifyAddItem extends ApiCall {
	
	private String email;
	//private String userid;
	//private String requestxml;
	private String taskid;
	
	public VerifyAddItem() throws Exception {
	}
	
	public VerifyAddItem(String[] args) throws Exception {
		this.email  = args[0];
		this.taskid = args[1];
	}
  
	public String call() throws Exception {
		
		HashMap<String,String> tokenmap = getUserIdToken(email);
		
		BasicDBObject userdbo =
			(BasicDBObject) db.getCollection("users").findOne(new BasicDBObject("email", email));
    
		String user_id = userdbo.getString("_id");
		String uuidprefix = user_id.substring(user_id.length()-8);
		
		/* set intermediate status */
		BasicDBObject query = new BasicDBObject();
		query.put("status", taskid);
    
		BasicDBObject update = new BasicDBObject();
		update.put("$set", new BasicDBObject("status", taskid+"_processing"));
		
		DBCollection coll = db.getCollection("items."+userdbo.getString("_id"));
		WriteResult result = coll.update(query, update, false, true);
		
		/* re-query */
		query.put("status", taskid+"_processing");
		
		//List<Future<String>> futures = new ArrayList<Future<String>>();
		
		/* each item */
		DBCursor cursor = coll.find(query);
		Integer count = cursor.count();
		Integer currentnum = 0;
		
		updatemessage(email, true, "Verifying " + count + " items...");
		
		while (cursor.hasNext()) {
			
			DBObject item = cursor.next();
			DBObject mod = (DBObject) item.get("mod");
			DBObject org = (DBObject) item.get("org");
			
			/* ScheduleTime */
			if (mod.containsField("ScheduleTime")) {
				SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:00.000");
				Date scheduletime = (Date) mod.get("ScheduleTime");
				String scheduletimestr = sdf.format(scheduletime);
				scheduletimestr = scheduletimestr.replace(" ", "T") + "Z";
				mod.put("ScheduleTime", scheduletimestr);
				
				log("mod:" + scheduletime);
				log("mod:" + scheduletimestr);
			}
			
			String userid = item.get("UserID").toString();
			String site   = mod.get("Site").toString();
			
			// todo: don't use user _id for prefix.
			String uuid = uuidprefix + item.get("_id").toString();
			uuid = uuid.toUpperCase();
			mod.put("UUID", uuid);
			
			BasicDBObject reqdbo = new BasicDBObject();
			reqdbo.append("ErrorLanguage", "en_US");
			reqdbo.append("WarningLevel", "High");
			reqdbo.append("RequesterCredentials", 
										new BasicDBObject("eBayAuthToken", tokenmap.get(userid)));
      reqdbo.append("MessageID",
                    getnewtokenmap(email) + " " + userid + " " + item.get("_id").toString());
			reqdbo.append("Item", mod);
      
			String jss = reqdbo.toString();
      
			JSONObject jso = JSONObject.fromObject(jss);
			JSONObject tmpitem = jso.getJSONObject("Item");
			expandElements(tmpitem);
			
			XMLSerializer xmls = new XMLSerializer();
			xmls.setObjectName("VerifyAddItemRequest");
			xmls.setNamespace(null, "urn:ebay:apis:eBLBaseComponents");
			xmls.setTypeHintsEnabled(false);
			
			String requestxml = xmls.write(jso);
			
			writelog("VerifyAddItem/VAI.req.xml", requestxml);
      
			updatemessage(email, true, "Verifying " + (currentnum+1) + " of " + count + " items...");
			currentnum++;
			
			Future<String> future = pool18.submit
				(new ApiCallTask(userid, getSiteID(site), requestxml, "VerifyAddItem"));
			future.get(); // wait
			
			//futures.add(future);
		}
		/*
		for (Future<String> future : futures) {
			future.get();
		}		
		*/
		
		updatemessage(email, false, "Verifying finished.");
		
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
    
		writelog("VerifyAddItem/res.xml", responsexml);
    
		BasicDBObject responsedbo = convertXML2DBObject(responsexml);
		log("Ack:"+responsedbo.get("Ack").toString());
		
		// todo: almost same as AddItems callback function.
		String[] messages = responsedbo.getString("CorrelationID").split(" ");
		String email  = getemailfromtokenmap(messages[0]);
		String userid = messages[1];
		String id     = messages[2];
    
		String timestamp = responsedbo.getString("Timestamp").replaceAll("\\.", "_");
    
		/* make log directory for each call */
		String savedir = basedir + "/logs/apicall/VerifyAddItem/" + timestamp.substring(0,10);
		if (!(new File(savedir)).exists()) {
			new File(savedir).mkdir();
		}
		writelog("VerifyAddItem/" + timestamp.substring(0,10) + "/" + userid + "." + id + ".xml",
             responsexml);
    
		/* get collection name for each users */
		BasicDBObject userquery = new BasicDBObject();
		userquery.put("email", email);
		userquery.put("userids2.username", userid);
		BasicDBObject userdbo = (BasicDBObject) db.getCollection("users").findOne(userquery);
    
    String itemcollname = "items." + userdbo.getString("_id");
		DBCollection coll = db.getCollection(itemcollname);
    
		BasicDBObject upditem = new BasicDBObject();
		upditem.put("status", "");
		
		// todo: aware <SeverityCode>Warning</SeverityCode>
		if (responsedbo.get("Errors") != null) {
			String errorclass = responsedbo.get("Errors").getClass().toString();
			BasicDBList errors = new BasicDBList();
			if (errorclass.equals("class com.mongodb.BasicDBObject")) {
				errors.add((BasicDBObject) responsedbo.get("Errors"));
			} else if (errorclass.equals("class com.mongodb.BasicDBList")) {
				errors = (BasicDBList) responsedbo.get("Errors");
			} else {
				log("Class Error:"+errorclass);
			}
			
			upditem.put("error", errors);
			
		} else {
      
			/* No error! verified. */
			upditem.put("error", null);
			
		}
		
		if (responsedbo.get("Message") != null) {
			upditem.put("message", responsedbo.getString("Message"));
		}
		
		WriteResult result = coll.update(new BasicDBObject("_id", new ObjectId(id)),
																		 new BasicDBObject("$set", upditem));
		
		return "";
	}
	
	// todo: fix duplication in AddItems
	private void expandElements(JSONObject item) throws Exception {
		
		for (Object key : item.keySet()) {
			
			String classname = item.get(key).getClass().toString();
			
			if (classname.equals("class net.sf.json.JSONObject")) {
				
				expandElements((JSONObject) item.get(key));
				
			} else if (classname.equals("class net.sf.json.JSONArray")) {
				
				((JSONArray) item.get(key)).setExpandElements(true);
				
				for (Object elm : (JSONArray) item.get(key)) {
					if (elm.getClass().toString().equals("class net.sf.json.JSONObject")) {
						expandElements((JSONObject) elm);
					}
				}
			}
		}
		
		return;
	}

	// todo: move to super class?
  /*
	private int getSiteID(String site) throws Exception {

		Integer siteid = null;
		
		DBObject row = db.getCollection("US.eBayDetails")
			.findOne(null, new BasicDBObject("SiteDetails", 1));
		BasicDBList sitedetails = (BasicDBList) row.get("SiteDetails");
		for (Object sitedbo : sitedetails) {
			if (site.equals(((BasicDBObject) sitedbo).getString("Site"))) {
				siteid = Integer.parseInt(((BasicDBObject) sitedbo).getString("SiteID"));
				break;
			}
		}
		
		return siteid;
	}
  */
}
