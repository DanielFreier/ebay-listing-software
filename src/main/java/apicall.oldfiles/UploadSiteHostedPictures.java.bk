package ebaytool.apicall;

import com.mongodb.*;
import java.util.*;
import java.util.concurrent.*;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

public class UploadSiteHostedPictures extends ApiCall implements Callable {
  
	private String email;
	private String userid;
  private String exturl;
  
	public UploadSiteHostedPictures() throws Exception {
	}
	
	public UploadSiteHostedPictures(String[] args) throws Exception {
    email  = args[0];
    userid = args[1];
    exturl = args[2];
	}
  
	public String call() throws Exception {
    
    String token = gettoken(email, userid);
    
		BasicDBObject reqdbo = new BasicDBObject();
		reqdbo.put("RequesterCredentials", new BasicDBObject("eBayAuthToken", token));
    reqdbo.put("ExternalPictureURL", exturl);
    
		String requestxml = convertDBObject2XML(reqdbo, "UploadSiteHostedPictures");
		
		writelog("UploadSiteHostedPictures/req.xml", requestxml);
		
		Future<String> future =
      pool18.submit(new ApiCallTask(0, requestxml, "UploadSiteHostedPictures"));
		String result = future.get();
		
		return result;
	}
	
	public String callback(String responsexml) throws Exception {
    
		writelog("UploadSiteHostedPictures/res.xml", responsexml);
    
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
    
    BasicDBObject shpd = (BasicDBObject) resdbo.get("SiteHostedPictureDetails");
    
    String epsurl = shpd.getString("FullURL");
    
		return epsurl;
	}
}
