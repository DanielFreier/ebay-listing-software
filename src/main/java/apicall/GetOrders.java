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

public class GetOrders extends ApiCall implements Callable {
  
  private String email;
  private String userid;
    
  public GetOrders() throws Exception {
  }
  
  public GetOrders(String[] args) throws Exception {
    this.email  = args[0];
    this.userid = args[1];
  }
  
  public String call() throws Exception {
    
    String token = gettoken(email, userid);
    
    BasicDBObject reqdbo = new BasicDBObject();
    reqdbo.put("RequesterCredentials", new BasicDBObject("eBayAuthToken", token));
    reqdbo.put("WarningLevel",     "High");
    reqdbo.put("DetailLevel", "ReturnAll");
    reqdbo.put("NumberOfDays",       "30");
    reqdbo.put("MessageID", getnewtokenmap(email) + " " + userid);
    
    String requestxml = convertDBObject2XML(reqdbo, "GetOrders");
    
    pool18.submit(new ApiCallTask(0, requestxml, "GetOrders"));
    
    // todo: next page (pagination)
    
    return "";
  }
  
  public String callback(String responsexml) throws Exception {
    
    JSONObject json = (JSONObject) new XMLSerializer().read(responsexml);
    
    BasicDBObject resdbo = convertXML2DBObject(responsexml);
    
    String[] messages = resdbo.getString("CorrelationID").split(" ");
    email  = getemailfromtokenmap(messages[0]);
    userid = messages[1];
    
    int pagenumber    = Integer.parseInt(resdbo.getString("PageNumber"));
    int ordercount    = Integer.parseInt(resdbo.getString("ReturnedOrderCountActual"));
    int ordersperpage = Integer.parseInt(resdbo.getString("OrdersPerPage"));
    
    writelog("GetOrders/" + email + "." + userid + "." + pagenumber + ".xml", responsexml);
    
    if (ordercount == 0) {
      log(userid+" no orders.");
      return "";
    }
    
		/* get collection name for each users */
    BasicDBObject userquery = new BasicDBObject();
		userquery.put("email", email);
		userquery.put("userids2.username", userid);
    BasicDBObject userdbo = (BasicDBObject) db.getCollection("users").findOne(userquery);
    
    String ordercollname = "orders." + userdbo.getString("_id");
    
		BasicDBObject orderarray = (BasicDBObject) resdbo.get("OrderArray");
		BasicDBList orders = new BasicDBList();
		String classname = orderarray.get("Order").getClass().toString();
		if (classname.equals("class com.mongodb.BasicDBObject")) {
			orders.add((BasicDBObject) orderarray.get("Order"));
		} else if (classname.equals("class com.mongodb.BasicDBList")) {
			orders = (BasicDBList) orderarray.get("Order");
		} else {
			log("Class Error:" + classname);
		}
		for (Object order : orders) {
      
			BasicDBObject org = (BasicDBObject) order;
			String orderid = org.get("OrderID").toString();
      
      BasicDBObject query = new BasicDBObject();
      query.put("org.OrderID", orderid);
      
      BasicDBObject update = new BasicDBObject();
      
      BasicDBObject set = new BasicDBObject();
      set.put("UserID", userid);
      set.put("org", org);
      set.put("error", null); // to clear past errors.
      
      update.put("$set", set);
      
      DBCollection ordercoll = db.getCollection(ordercollname);
      ordercoll.update(query, update, true, false);
    }
    
    /*
    DBCollection ordercoll = db.getCollection("orders."+userdbo.getString("_id"));
    log("orders."+userdbo.getString("_id"));
    
    JSONArray jsonarr = new JSONArray();
    if (ordercount == 1) {
      jsonarr.add(json.getJSONObject("OrderArray").getJSONObject("Order"));
    } else {
      jsonarr = json.getJSONObject("OrderArray").getJSONArray("Order");
    }
    for (Object order : jsonarr) {
      
      DBObject dbobject = (DBObject) com.mongodb.util.JSON.parse(order.toString());
      String orderid = dbobject.get("OrderID").toString();
      
      log(orderid);
      
      //dbobject.put("_id", orderid);
      
      BasicDBObject query = new BasicDBObject();
      query.put("_id", orderid);
      
      BasicDBObject update = new BasicDBObject();
      update.put("$set", dbobject);
      
      WriteResult result = ordercoll.update(query, update, true, false);
      log(result.getError());
    }
    */
    
    return "";
  }
    
}
