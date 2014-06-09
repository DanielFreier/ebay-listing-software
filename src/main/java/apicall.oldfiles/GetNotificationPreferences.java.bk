package ebaytool.apicall;

import com.mongodb.*;
import java.util.*;
import java.util.concurrent.*;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

public class GetNotificationPreferences extends ApiCall implements Callable {
	
	private String email;
	private String userid;
	
	public GetNotificationPreferences() throws Exception {
	}
    
	public GetNotificationPreferences(String[] args) throws Exception {
		this.email  = args[0];
		this.userid = args[1];
	}
	
	public String call() throws Exception {
        
		/* get token from db */
		BasicDBObject query = new BasicDBObject();
		query.put("email", email);
		query.put("userids."+userid, new BasicDBObject("$exists", 1));
		
		BasicDBObject fields = new BasicDBObject();
		fields.put("userids."+userid, 1);
		
		BasicDBObject user = (BasicDBObject) db.getCollection("users").findOne(query, fields);
		
		BasicDBObject useriddbo = (BasicDBObject) user.get("userids");
		BasicDBObject tokendbo  = (BasicDBObject) useriddbo.get(userid);
		String token = tokendbo.getString("eBayAuthToken");
		
		/* GetNotificationPreferences */
		BasicDBObject reqdbo = new BasicDBObject();
		reqdbo.put("RequesterCredentials", new BasicDBObject("eBayAuthToken", token));
		reqdbo.put("PreferenceLevel", "User");
		reqdbo.put("MessageID", email+" "+userid);
		
		String requestxml = convertDBObject2XML(reqdbo, "GetNotificationPreferences");
		
		writelog("GetNotificationPreferences/"+userid+".req.xml", requestxml);
		
		Future<String> future =
			pool18.submit(new ApiCallTask(0, requestxml, "GetNotificationPreferences"));
		future.get();
		
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
        
		String[] messages = resdbo.getString("CorrelationID").split(" ");
		email  = messages[0];
		userid = messages[1];
		
		writelog("GetNotificationPreferences/"+email+"."+userid+".xml", responsexml);
		
		return "";
	}
}
