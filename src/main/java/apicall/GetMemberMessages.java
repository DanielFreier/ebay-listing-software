package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.net.URL;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.*;
import javax.net.ssl.HttpsURLConnection;
import net.sf.json.JSONObject;
import net.sf.json.JSONArray;
import net.sf.json.xml.XMLSerializer;

public class GetMemberMessages extends ApiCall implements Callable {
	
	private String email;
	private String userid;
	private String itemid;
	private String start;
	private String end;
    
	public GetMemberMessages() throws Exception {
	}
	
	public GetMemberMessages(String[] args) throws Exception {
    
		email  = args[0];
		userid = args[1];
    
		if (args.length == 3) {
			itemid = args[2];
		} else if (args.length == 4) {
			itemid = null;
			start = args[2];
			end   = args[3];
		}
	}
	
	public String call() throws Exception {
    
		String token = gettoken(email, userid);
    
    BasicDBObject reqdbo = new BasicDBObject();
    reqdbo.put("RequesterCredentials", new BasicDBObject("eBayAuthToken", token));
    reqdbo.put("WarningLevel", "High");
    reqdbo.put("DetailLevel", "ReturnAll");
		reqdbo.put("MailMessageType", "All");
		reqdbo.put("MessageID", getnewtokenmap(email) + " " + userid + " " + itemid);
		if (itemid != null) {
			reqdbo.put("ItemID", itemid);
		} else {
			reqdbo.put("StartCreationTime", start);
			reqdbo.put("EndCreationTime", end);
		}
		
    String requestxml = convertDBObject2XML(reqdbo, "GetMemberMessages");
		
    Future<String> future =
      pool18.submit(new ApiCallTask(userid, 0, requestxml, "GetMemberMessages"));
		future.get();
    
    // todo: next page (pagination)
    
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd_HH:mm:ss_S");
		Date now = new Date();
		writelog("GetMemberMessages/res"+sdf.format(now).toString()+".xml", responsexml);
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
    
		String[] messages = resdbo.getString("CorrelationID").split(" ");
		email  = getemailfromtokenmap(messages[0]);
		userid = messages[1];
		if (messages.length == 3) {
			itemid = messages[2];
		}
		
		writelog("GetMemberMessages/"+email+"."+userid+"."+itemid+".xml", responsexml);
		
    upsertmembermessage(resdbo);
		
		return "";
	}
  
  public void upsertmembermessage(BasicDBObject dbo) throws Exception {
		
		BasicDBObject pr = (BasicDBObject) dbo.get("PaginationResult");
		int total = Integer.parseInt(pr.getString("TotalNumberOfEntries"));
		if (total == 0) return;
    
    BasicDBObject mm = (BasicDBObject) dbo.get("MemberMessage");
    String messageclass = mm.get("MemberMessageExchange").getClass().toString();
    BasicDBList membermessages = new BasicDBList();
    if (messageclass.equals("class com.mongodb.BasicDBObject")) {
      membermessages.add((BasicDBObject) mm.get("MemberMessageExchange"));
    } else if (messageclass.equals("class com.mongodb.BasicDBList")) {
      membermessages = (BasicDBList) mm.get("MemberMessageExchange");
    }
		for (Object tmpmsg : membermessages) {
      
			BasicDBObject mme = (BasicDBObject) tmpmsg;
      
			BasicDBObject item = (BasicDBObject) mme.get("Item");
			BasicDBObject question = (BasicDBObject) mme.get("Question");
      
			if (!question.getString("MessageType").equals("AskSellerQuestion")) {
				continue;
			}
			
			BasicDBObject seller = (BasicDBObject) item.get("Seller");
      
			String itemid = item.getString("ItemID");
			String userid = seller.getString("UserID");
			String messageid = question.getString("MessageID");
			
			/* get collection name for the users */
			BasicDBObject userquery = new BasicDBObject();
			userquery.put("userids2.username", userid);
			BasicDBObject userdbo = (BasicDBObject) db.getCollection("users").findOne(userquery);
      
      String email = userdbo.getString("email");
			
			DBCollection itemcoll = db.getCollection("items."+userdbo.getString("_id"));
      
      /* GetItem if the item does not exist. */
      BasicDBObject query = new BasicDBObject();
      query.put("org.ItemID", itemid);
      
      DBObject exitem = itemcoll.findOne(query);
      if (exitem == null) {
        log("call GetItem from GetMemberMessages upsertmembermessage().");
        String[] args = {email, userid, itemid, "waitcallback"};
        GetItem getitem = new GetItem(args);
        getitem.call();
      }
			
      mme.removeField("Item");
      
      mme.put("CreationDate",     convertdate(mme.getString("CreationDate")));
      mme.put("LastModifiedDate", convertdate(mme.getString("LastModifiedDate")));
      
      /* Remove existing message */
      BasicDBObject update = new BasicDBObject();
      update.put("$pull", new BasicDBObject("membermessages",
                                            new BasicDBObject("Question.MessageID", messageid)));
			itemcoll.update(query, update);
      
      /* Insert new message */
      update = new BasicDBObject();
      update.put("$push", new BasicDBObject("membermessages", mme));
			itemcoll.update(query, update);
      
		}
    
    return;
  }
  
  private Date convertdate(String datestr) throws Exception {
    
    datestr = datestr.replace("T", " ").replace(".000Z", "");
    
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    sdf.setLenient(false);
    sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
    Date date = sdf.parse(datestr);
    
    return date;
  }
}
