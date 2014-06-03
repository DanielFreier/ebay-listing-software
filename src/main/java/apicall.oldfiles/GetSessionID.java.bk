package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.net.Socket;
import java.util.concurrent.*;
import javax.net.ssl.HttpsURLConnection;
import org.bson.types.ObjectId;

public class GetSessionID extends ApiCall {
  
	private String email;
  
	public GetSessionID() throws Exception {
  }
  
	public GetSessionID(String[] args) throws Exception {
		this.email = args[0];
	}
	
	public String call() throws Exception {
    
		BasicDBObject reqdbo = new BasicDBObject();
		reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", admintoken));
		reqdbo.append("WarningLevel", "High");
		reqdbo.append("RuName", configdbo.getString("runame"));
		reqdbo.append("MessageID", getnewtokenmap(email));
		
		String requestxml = convertDBObject2XML(reqdbo, "GetSessionID");
		writelog("GetSessionID/"+email+".req.xml", requestxml);
		
		Future<String> future = pool18.submit(new ApiCallTask(0, requestxml, "GetSessionID"));
		String result = future.get();
		
		return result;
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		
		String sessionid = resdbo.getString("SessionID");
		String email = getemailfromtokenmap(resdbo.getString("CorrelationID"));
    
		log("GetSessionID callback : "+email);
		
		writelog("GetSessionID/"+email+".xml", responsexml);
		
		BasicDBObject query = new BasicDBObject();
		query.put("email", email);
		
		BasicDBObject update = new BasicDBObject();
		update.put("$set", new BasicDBObject("sessionid", sessionid));
		
		db.getCollection("users").update(query, update);
		
		return sessionid;
	}
}
