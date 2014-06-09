package ebaytool.apicall;

import com.mongodb.*;
import java.util.*;
import java.util.concurrent.*;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

public class SetNotificationPreferences extends ApiCall implements Callable {
	
	private String email;
	private String userid;
	
	public SetNotificationPreferences() throws Exception {
	}
  
	public SetNotificationPreferences(String[] args) throws Exception {
    
    if (args.length == 2) {
      email  = args[0];
      userid = args[1];
    }
    
	}
  
	public String call() throws Exception {
    
		DBCollection coll = db.getCollection("users");
    
    BasicDBObject query = new BasicDBObject();
    
    if (email != null) {
      query.put("email", email);
      query.put("userids2.username", userid);
    }
    
		DBCursor cursor = coll.find(query);
		while (cursor.hasNext()) {
			BasicDBObject user = (BasicDBObject) cursor.next();
      
      String email = user.getString("email");
      
      if (!user.containsField("userids2")) continue;
      if (email.equals("demo@listers.in")) continue;
      
      for (Object useridobj : (BasicDBList) user.get("userids2")) {
        
        String userid = ((BasicDBObject) useridobj).getString("username");
        String token  = ((BasicDBObject) useridobj).getString("eBayAuthToken");
        
				/* SetNotificationPreferences */
				ArrayList<BasicDBObject> ane = new ArrayList<BasicDBObject>();
        
				String[] events = {"ItemListed",
                           "EndOfAuction",
                           "ItemClosed",
                           "ItemExtended",
                           "ItemRevised",
                           "ItemSold",
                           "ItemUnsold",
                           "ItemSuspended",
                           "ItemLost",
                           "AskSellerQuestion",
                           "TokenRevocation",
                           "UserIDChanged",
                           "MyMessageseBayMessage",
                           "MyMessagesM2MMessage"};
				for (String event : events) {
					BasicDBObject ne = new BasicDBObject();
					ne.put("EventType", event);
					ne.put("EventEnable", "Enable");
					//ne.put("EventEnable", "Disable");
					ane.add(ne);
				}
				
				BasicDBObject adp = new BasicDBObject();
				adp.put("ApplicationEnable", "Enable");
				adp.put("ApplicationURL", "http://"+configdbo.getString("hostname")+"/page/receivenotify");
				
				BasicDBObject dbobject = new BasicDBObject();
				dbobject.put("RequesterCredentials", new BasicDBObject("eBayAuthToken", token));
				dbobject.put("ApplicationDeliveryPreferences", adp);
				dbobject.put("UserDeliveryPreferenceArray", new BasicDBObject("NotificationEnable", ane));
				dbobject.put("MessageID", getnewtokenmap(email) + " " + userid);
        
				JSONObject jso = JSONObject.fromObject(dbobject.toString());
				jso.getJSONObject("UserDeliveryPreferenceArray")
					.getJSONArray("NotificationEnable").setExpandElements(true);
				
				XMLSerializer xmls = new XMLSerializer();
				xmls.setObjectName("SetNotificationPreferencesRequest");
				xmls.setNamespace(null, "urn:ebay:apis:eBLBaseComponents");
				xmls.setTypeHintsEnabled(false);
				String requestxml = xmls.write(jso);
        
				Future<String> future =
					pool18.submit(new ApiCallTask(userid, 0, requestxml, "SetNotificationPreferences"));
				future.get();
      }
    }    
    
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
    
		String[] messages = resdbo.getString("CorrelationID").split(" ");
		email  = getemailfromtokenmap(messages[0]);
		userid = messages[1];
    
		writelog("SetNotificationPreferences/"+userid+".xml", responsexml);
		
		return "";
	}
}
