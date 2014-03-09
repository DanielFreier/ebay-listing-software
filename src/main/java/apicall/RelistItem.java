package ebaytool.apicall;

import com.mongodb.*;
import com.mongodb.util.*;
import java.io.*;
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

public class RelistItem extends ApiCall {
	
	private String email;
	private String taskid;
	
	public RelistItem() throws Exception {
	}
	
	public RelistItem(String[] args) throws Exception {
		this.email  = args[0];
		this.taskid = args[1];
	}
	
	public String call() throws Exception {
		
		String userid;
		String site;
		HashMap<String,String> tokenmap = getUserIdToken(email);
		
		BasicDBObject userdbo =
			(BasicDBObject) db.getCollection("users").findOne(new BasicDBObject("email", email));
		String user_id = userdbo.getString("_id");
		String uuidprefix = user_id.substring(user_id.length()-8);
		
		/* set intermediate status */
		BasicDBObject query = new BasicDBObject();
		query.put("deleted",    new BasicDBObject("$exists", 0));
		query.put("org.ItemID", new BasicDBObject("$exists", 1));
		query.put("status",     taskid);
		
		BasicDBObject update = new BasicDBObject();
		update.put("$set", new BasicDBObject("status", taskid+"_processing"));
		
		DBCollection coll = db.getCollection("items."+userdbo.getString("_id"));
		WriteResult result = coll.update(query, update, false, true);
		
		/* re-query */
		query.put("status", taskid+"_processing");
		DBCursor cur = coll.find(query);
		Integer count = cur.count();
		Integer currentnum = 0;
    
		updatemessage(email, true, "Relisting " + count + " items.");
    
		while (cur.hasNext()) {
			DBObject item = cur.next();
			BasicDBObject mod = (BasicDBObject) item.get("mod");
			BasicDBObject org = (BasicDBObject) item.get("org");
      
			String uuid = uuidprefix + item.get("_id").toString();
			uuid = uuid.toUpperCase();
			//mod.put("UUID", uuid);
      mod.removeField("UUID");
			mod.put("ItemID", org.get("ItemID").toString());
			
      String banner = readfile(basedir + "/data/banner.html");
      mod.put("Description", mod.getString("Description") + banner);
      
			userid = ((BasicDBObject) org.get("Seller")).get("UserID").toString();
			site   = mod.get("Site").toString();
			
			BasicDBObject reqdbo = new BasicDBObject();
			reqdbo.append("RequesterCredentials",
                    new BasicDBObject("eBayAuthToken", tokenmap.get(userid)));
			reqdbo.append("ErrorLanguage", "en_US");
			reqdbo.append("WarningLevel", "High");
			reqdbo.append("Item", mod);
      reqdbo.append("MessageID", getnewtokenmap(email) + " " + userid + " " 
                    + item.get("_id").toString());
      
			// copy from AddItems
			String jss = reqdbo.toString();
					
			JSONObject jso = JSONObject.fromObject(jss);
			JSONObject tmpi = ((JSONObject) jso).getJSONObject("Item");
			expandElements(tmpi);
			
			XMLSerializer xmls = new XMLSerializer();
			xmls.setObjectName("RelistItemRequest");
			xmls.setNamespace(null, "urn:ebay:apis:eBLBaseComponents");
			xmls.setTypeHintsEnabled(false);
					
			String requestxml = xmls.write(jso);
					
			//String requestxml = convertDBObject2XML(reqdbo, "RelistItem");
			writelog("RelistItem/req.xml", requestxml);
			
			updatemessage(email, true, "Relisting "+(currentnum+1)+" of "+count+" items.");
			currentnum++;
					
			Future<String> future = pool18.submit
				(new ApiCallTask(userid, getSiteID(site), requestxml, "RelistItem"));
			future.get(); // wait
		}
    
		updatemessage(email, false, "Relisting finished.");
		
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject responsedbo = convertXML2DBObject(responsexml);
    
		String[] messages = responsedbo.getString("CorrelationID").split(" ");
    String email  = getemailfromtokenmap(messages[0]);
    String userid = messages[1];
		String id     = messages[2];
    
    BasicDBObject userdbo = (BasicDBObject) db.getCollection("users")
      .findOne(new BasicDBObject("email", email));
    
    DBCollection coll = db.getCollection("items." + userdbo.getString("_id"));
    
		String itemid    = responsedbo.getString("ItemID");
		String starttime = responsedbo.getString("StartTime");
		String endtime   = responsedbo.getString("EndTime");
		
		String timestamp = responsedbo.getString("Timestamp").replaceAll("\\.", "_");
		String savedir = basedir + "/logs/apicall/RelistItem/" + timestamp.substring(0,10);
		if (!(new File(savedir)).exists()) {
			new File(savedir).mkdir();
		}
		writelog("RelistItem/" + timestamp.substring(0,10) + "/" + userid + "." + itemid + ".xml",
             responsexml);
    
		log("Ack:" + responsedbo.get("Ack").toString());
		
		BasicDBObject upditem = new BasicDBObject();
		upditem.put("status", "");
		if (itemid != null) {
			upditem.put("org.ItemID", itemid);
			upditem.put("org.ListingDetails.StartTime", starttime);
			upditem.put("org.ListingDetails.EndTime", endtime);
			upditem.put("org.SellingStatus.ListingStatus", "Active");
		}
    
    boolean iserror = false;
		
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
      
      for (Object err : errors) {
        String severitycode = ((BasicDBObject) err).getString("SeverityCode");
        if (severitycode.equals("Error")) {
          iserror = true;
        }
      }
      
		} else {
			
			/* No error! */
			upditem.put("error", null);
			
		}
		
		BasicDBObject query = new BasicDBObject();
		query.put("_id", new ObjectId(id));
		
		BasicDBObject update = new BasicDBObject();
		update.put("$set", upditem);
    
		WriteResult result = coll.update(query, update);
		
    /* apilog */
    Date now = new Date();
    
    BasicDBObject apilog = new BasicDBObject();
    apilog.put("date",   now);
    apilog.put("email",  email);
    apilog.put("userid", userid);
    apilog.put("itemid", id);
    apilog.put("callname", "RelistItem");
    if (iserror) {
      apilog.put("result", "failure");
    } else {
      apilog.put("result", "success");
    }
    
    DBCollection apilogcoll = db.getCollection("apilog");
    apilogcoll.insert(apilog);
    
		return "";
	}
  
	// todo: not copy from AddItems
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
}
