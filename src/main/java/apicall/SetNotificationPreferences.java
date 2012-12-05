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
		email  = args[0];
		userid = args[1];
	}
  
	public String call() throws Exception {
    
    String token = gettoken(email, userid);
		
		/* SetNotificationPreferences */
		ArrayList<BasicDBObject> ane = new ArrayList<BasicDBObject>();
		
		String[] events = {"ItemListed",
                       "EndOfAuction",
                       "ItemClosed",
                       "ItemExtended",
                       "ItemRevised",
                       "ItemSold",
                       "ItemUnsold",
                       "AskSellerQuestion"};
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
		dbobject.put("MessageID", email+" "+userid);
		
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
		
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
    
		String[] messages = resdbo.getString("CorrelationID").split(" ");
		email  = messages[0];
		userid = messages[1];
    
		writelog("SetNotificationPreferences/"+userid+".xml", responsexml);
		
		return "";
	}
}
