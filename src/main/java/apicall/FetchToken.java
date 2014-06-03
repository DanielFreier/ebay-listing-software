package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.net.URL;
import java.util.*;
import java.util.concurrent.*;
import javax.net.ssl.HttpsURLConnection;
import net.sf.json.JSONObject;
import net.sf.json.JSONArray;
import net.sf.json.xml.XMLSerializer;
import org.bson.types.ObjectId;

public class FetchToken extends ApiCall {

	private String email;
	private String sessionid;
	private String username;
	
	public FetchToken() throws Exception {
	}
    
	public FetchToken(String[] args) throws Exception {
		this.email     = args[0];
		this.sessionid = args[1];
		this.username  = args[2];
	}
	
	public String call() throws Exception {
    
		BasicDBObject reqdbo = new BasicDBObject();
		reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", admintoken));
		reqdbo.append("WarningLevel", "High");
		reqdbo.append("SessionID", sessionid);
		reqdbo.append("MessageID", getnewtokenmap(email) + " " + username);
		
		String requestxml = convertDBObject2XML(reqdbo, "FetchToken");
		writelog("FetchToken/" + username + ".req.xml", requestxml);
    
		Future<String> future = pool18.submit(new ApiCallTask(0, requestxml, "FetchToken"));
		future.get();
		
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		
		String[] messages = resdbo.getString("CorrelationID").split(" ");
		String email    = getemailfromtokenmap(messages[0]);
		String username = messages[1];
    
		writelog("FetchToken/" + username + ".xml", responsexml);
		
    resdbo.put("username", username);
    
    resdbo.removeField("@xmlns");
    resdbo.removeField("Ack");
    resdbo.removeField("CorrelationID");
    resdbo.removeField("Version");
    resdbo.removeField("Build");
    
		BasicDBObject query = new BasicDBObject();
		query.put("email", email);
		
		BasicDBObject update = new BasicDBObject();
		update.put("$pull", new BasicDBObject("userids2", new BasicDBObject("username", username)));
    
		db.getCollection("users").update(query, update);
    
		update = new BasicDBObject();
		update.put("$push", new BasicDBObject("userids2", resdbo));
    
		db.getCollection("users").update(query, update);
		
    updatemessage(email, false, "Added eBay account " + username + ".");
    
		return "";
	}
}
