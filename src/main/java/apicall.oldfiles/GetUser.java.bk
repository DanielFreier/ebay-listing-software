package ebaytool.apicall;

import com.mongodb.*;
import java.util.*;
import java.util.concurrent.*;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

public class GetUser extends ApiCall implements Callable {
	
	private String email;
	private String userid;
	
	public GetUser() throws Exception {
	}
	
	public GetUser(String[] args) throws Exception {
		this.email  = args[0];
		this.userid = args[1];
	}
	
	public String call() throws Exception {
		
		String token = gettoken(email, userid);
		
		BasicDBObject reqdbo = new BasicDBObject();
		reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", token));
		reqdbo.append("MessageID", getnewtokenmap(email) + " " + userid);
		
		String requestxml = convertDBObject2XML(reqdbo, "GetUser");
    
		writelog("GetUser/" + userid + ".req.xml", requestxml);
    
		pool18.submit(new ApiCallTask(0, requestxml, "GetUser"));
		
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		
		String[] messages = resdbo.getString("CorrelationID").split(" ");
		email = getemailfromtokenmap(messages[0]);
		userid = messages[1];
		
		writelog("GetUser/" + userid + ".xml", responsexml);
		
		return "";
	}
}
