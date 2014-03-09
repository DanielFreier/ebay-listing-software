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

public class EndItems extends ApiCall {
	
	private String email;
	private String userid;
	private String site;
	private String chunkidx;
	private String requestxml;
	private String taskid;
	
	public EndItems() throws Exception {
	}
	
	public EndItems(String[] args) throws Exception {
		this.email  = args[0];
		this.taskid = args[1];
	}
	
	public String call() throws Exception {
		
		String userid;
		String site;
		HashMap<String,String> tokenmap = getUserIdToken(email);
    
		BasicDBObject userdbo =
			(BasicDBObject) db.getCollection("users").findOne(new BasicDBObject("email", email));
		
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
		
		LinkedHashMap<String,LinkedHashMap> lhm = new LinkedHashMap<String,LinkedHashMap>();
		DBCursor cur = coll.find(query);
		Integer count = cur.count();
		updatemessage(email, true, "Ending " + count + " items.");
		while (cur.hasNext()) {
			DBObject item = cur.next();
			DBObject mod = (DBObject) item.get("mod");
			DBObject org = (DBObject) item.get("org");
      
			userid = ((DBObject) org.get("Seller")).get("UserID").toString();
			site   = mod.get("Site").toString();
			
			if (!lhm.containsKey(userid)) {
				lhm.put(userid, new LinkedHashMap<String,LinkedHashMap>());
			}
			
			if (!lhm.get(userid).containsKey(site)) {
				((LinkedHashMap) lhm.get(userid)).put(site, new LinkedHashMap<Integer,ArrayList>());
				((LinkedHashMap) lhm.get(userid).get(site)).put(0, new ArrayList<DBObject>());
			}
			
			int curidx = ((LinkedHashMap) lhm.get(userid).get(site)).size();
			int size = ((List) ((LinkedHashMap) lhm.get(userid).get(site)).get(curidx-1)).size();
			if (size >= 10) {
				((LinkedHashMap) lhm.get(userid).get(site)).put(curidx,
																new ArrayList<DBObject>());
				curidx = ((LinkedHashMap) lhm.get(userid).get(site)).size();
			}
			
			// add item data to each userid.site.chunk array.
			((List) ((LinkedHashMap) lhm.get(userid).get(site)).get(curidx-1)).add(item);
		}
		
		// each userid
		Integer currentnum = 0;
		for (String tmpuserid : lhm.keySet()) {
			LinkedHashMap lhmuserid = lhm.get(tmpuserid);
			
			// each site
			for (Object tmpsite : lhmuserid.keySet()) {
				LinkedHashMap lhmsite = (LinkedHashMap) lhmuserid.get(tmpsite);
				
				// each chunk
				for (Object tmpchunk : lhmsite.keySet()) {
					List litems = (List) lhmsite.get(tmpchunk);
					
					BasicDBObject requestdbo = new BasicDBObject();
					requestdbo.append("WarningLevel", "High");
					requestdbo.append("RequesterCredentials",
                            new BasicDBObject("eBayAuthToken", tokenmap.get(tmpuserid)));
					
					int messageid = 0;
					Integer tmpcnt = 0;
					List<DBObject> ldbo = new ArrayList<DBObject>();
					for (Object tmpidx : litems) {
						String id     = ((BasicDBObject) tmpidx).get("_id").toString();
						String itemid = ((BasicDBObject) ((BasicDBObject) tmpidx)
                             .get("org")).getString("ItemID");
            
            String messageidstring = getnewtokenmap(email);
            messageidstring += " " + tmpuserid;
            messageidstring += " " + id;
            
            ldbo.add(new BasicDBObject("MessageID", messageidstring)
                     .append("ItemID", itemid)
                     .append("EndingReason", "NotAvailable"));
						tmpcnt++;
					}
					
					requestdbo.append("EndItemRequestContainer", ldbo);
					
					JSONObject jso = JSONObject.fromObject(requestdbo.toString());
					jso.getJSONArray("EndItemRequestContainer").setExpandElements(true);
					
					XMLSerializer xmls = new XMLSerializer();
					xmls.setObjectName("EndItemsRequest");
					xmls.setNamespace(null, "urn:ebay:apis:eBLBaseComponents");
					xmls.setTypeHintsEnabled(false);
					String requestxml = xmls.write(jso);
					
					writelog("EndItems/"
                   +((String) tmpuserid)
                   +"."+((String) tmpsite)
                   +"."+new Integer(Integer.parseInt(tmpchunk.toString())).toString()
                   +".xml", requestxml);
					
					updatemessage(email, true, "Ending "+(currentnum+1)+"-"+(currentnum+tmpcnt)
                        + " of "+count+" items on eBay.");
					currentnum += tmpcnt;
					
					Future<String> future = pool18.submit
						(new ApiCallTask(tmpuserid, 0, requestxml, "EndItems"));
					future.get(); // wait
				}
			}
		}
		
		updatemessage(email, false, "Ending finished.");
		
		return "OK";
	}
	
	public String callback(String responsexml) throws Exception {
		
		writelog("EndItems/res.xml", responsexml);
    
		BasicDBObject responsedbo = convertXML2DBObject(responsexml);
		
		log("Ack: "+responsedbo.get("Ack").toString());
		
		String classname = responsedbo.get("EndItemResponseContainer").getClass().toString();
		
		BasicDBList dbl = new BasicDBList();
		if (classname.equals("class com.mongodb.BasicDBObject")) {
			dbl.add((BasicDBObject) responsedbo.get("EndItemResponseContainer"));
		} else if (classname.equals("class com.mongodb.BasicDBList")) {
			dbl = (BasicDBList) responsedbo.get("EndItemResponseContainer");
		} else {
			log("EndItem response Class Error:"+classname);
			return "";
		}
		
		for (Object oitem : dbl) {
			
			BasicDBObject item = (BasicDBObject) oitem;
			
			String[] messages = item.getString("CorrelationID").split(" ");
      String email  = getemailfromtokenmap(messages[0]);
      String userid = messages[1];
      String id     = messages[2];
      
      BasicDBObject userdbo = (BasicDBObject) db.getCollection("users")
        .findOne(new BasicDBObject("email", email));
      
      DBCollection coll = db.getCollection("items." + userdbo.getString("_id"));
			
			BasicDBObject upditem = new BasicDBObject();
			upditem.put("status", "");
			
			if (item.containsField("EndTime")) {
				upditem.put("org.ListingDetails.EndTime", item.getString("EndTime"));
			}

      boolean iserror = false;
      
			if (item.containsField("Errors")) {
				String errorclass = item.get("Errors").getClass().toString();
        
				BasicDBList errors = new BasicDBList();
				if (errorclass.equals("class com.mongodb.BasicDBObject")) {
					errors.add((BasicDBObject) item.get("Errors"));
				} else if (errorclass.equals("class com.mongodb.BasicDBList")) {
					errors = (BasicDBList) item.get("Errors");
				} else {
					log("Class Error:"+errorclass);
					continue;
				}
				upditem.put("error", errors);
        
        for (Object err : errors) {
          String severitycode = ((BasicDBObject) err).getString("SeverityCode");
          if (severitycode.equals("Error")) {
            iserror = true;
          }
        }
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
      apilog.put("callname", "EndItem");
      if (iserror) {
        apilog.put("result", "failure");
      } else {
        apilog.put("result", "success");
      }
      
      DBCollection apilogcoll = db.getCollection("apilog");
      apilogcoll.insert(apilog);
		}
		
		return "";
	}
}
