package ebaytool.apicall;

import com.mongodb.*;
import com.mongodb.util.*;

import java.io.*;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
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

public class AddItems extends ApiCall {
  
  private String email;
  private String userid;
  private String site;
  private String chunkidx;
  private String[] itemids;
  private String requestxml;
  private String taskid;
  
  public AddItems() throws Exception {
  }
  
  public AddItems(String[] args) throws Exception {
    this.email  = args[0];
    this.taskid = args[1];
  }
  
  public String call() throws Exception {
    
    String userid;
    String site;
    HashMap<String,String> tokenmap = getUserIdToken(email);
    
    BasicDBObject userdbo =
      (BasicDBObject) db.getCollection("users").findOne(new BasicDBObject("email", email));
    String user_id = userdbo.getString("_id");
    
    // todo: don't use user_id for uuidprefix.
    String uuidprefix = user_id.substring(user_id.length()-8);
    
    /* set intermediate status */
    BasicDBObject query = new BasicDBObject();
    query.put("deleted", new BasicDBObject("$exists", 0));
    query.put("ItemID",  new BasicDBObject("$exists", 0));
    query.put("status",  taskid);
    
    BasicDBObject update = new BasicDBObject();
    update.put("$set", new BasicDBObject("status", taskid+"_processing"));
    
    DBCollection coll = db.getCollection("items."+userdbo.getString("_id"));
    WriteResult result = coll.update(query, update, false, true);
    
    /* re-query */
    query.put("status", taskid+"_processing");
    
    /* build userid.site.chunk array */
    LinkedHashMap<String,LinkedHashMap> lhm = new LinkedHashMap<String,LinkedHashMap>();
    DBCursor cur = coll.find(query);
    Integer count = cur.count();
    updatemessage(email, true, "Listing " + count + " items to eBay.");
    while (cur.hasNext()) {
      DBObject item = cur.next();
      DBObject mod = (DBObject) item.get("mod");
      DBObject org = (DBObject) item.get("org");
      
      String uuid = uuidprefix + item.get("_id").toString();
      uuid = uuid.toUpperCase();
      mod.put("UUID", uuid);
			
      userid = item.get("UserID").toString();
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
      if (size >= 5) {
        ((LinkedHashMap) lhm.get(userid).get(site)).put(curidx, new ArrayList<DBObject>());
        curidx = ((LinkedHashMap) lhm.get(userid).get(site)).size();
      }
      
      // add item data to each userid.site.chunk array.
      ((List) ((LinkedHashMap) lhm.get(userid).get(site)).get(curidx-1)).add(item);
    }    
    
    /* each userid */
    Integer currentnum = 0;
    for (String tmpuserid : lhm.keySet()) {
      LinkedHashMap lhmuserid = lhm.get(tmpuserid);
      
      /* each site */
      for (Object tmpsite : lhmuserid.keySet()) {
        LinkedHashMap lhmsite = (LinkedHashMap) lhmuserid.get(tmpsite);
        
        String parentmessageid = "";
        parentmessageid = getnewtokenmap(userdbo.getString("email"));
        parentmessageid += " " + tmpuserid;
        
        /* each chunk (5 items)*/
        for (Object tmpchunk : lhmsite.keySet()) {
          List litems = (List) lhmsite.get(tmpchunk);
          
          BasicDBObject reqdbo = new BasicDBObject();
          reqdbo.append("ErrorLanguage", "en_US");
          reqdbo.append("WarningLevel", "High");
          reqdbo.append("RequesterCredentials",
                        new BasicDBObject("eBayAuthToken", tokenmap.get(tmpuserid)));
          
          String[] itemids = new String[5];
          int messageid = 0;
          Integer tmpcnt = 0;
          List<DBObject> ldbo = new ArrayList<DBObject>();
          for (Object tmpidx : litems) {
            
            BasicDBObject mod = (BasicDBObject) ((DBObject) tmpidx).get("mod");
            
            /* Add banner */
            // todo: avoid duplicate link
						String banner = readfile(basedir + "/data/banner.html");
            mod.put("Description", mod.getString("Description") + banner);
						
						/* ScheduleTime */
						if (mod.containsField("ScheduleTime")) {
							SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:00.000");
							Date scheduletime = (Date) mod.get("ScheduleTime");
							String scheduletimestr = sdf.format(scheduletime);
							scheduletimestr = scheduletimestr.replace(" ", "T") + "Z";
							mod.put("ScheduleTime", scheduletimestr);
						}
						
            itemids[messageid] = ((BasicDBObject) tmpidx).get("_id").toString();
            
            String id = ((BasicDBObject) tmpidx).get("_id").toString();
            
            String msgid = getnewtokenmap(userdbo.getString("email")) + " " + tmpuserid + " " + id;
            
            ldbo.add(new BasicDBObject("MessageID", msgid).append("Item", mod));
            
            parentmessageid += " " + id;
            
            tmpcnt++;
          }
          reqdbo.append("MessageID", parentmessageid);
          reqdbo.append("AddItemRequestContainer", ldbo);
          
          /* each item */
          String jss = reqdbo.toString();
          
          JSONObject jso = JSONObject.fromObject(jss);
          JSONArray tmpitems = jso.getJSONArray("AddItemRequestContainer");
          for (Object tmpitem : tmpitems) {
            JSONObject tmpi = ((JSONObject) tmpitem).getJSONObject("Item");
            expandElements(tmpi);
          }      
          jso.getJSONArray("AddItemRequestContainer").setExpandElements(true);
          
          writelog("AddItems/jso.txt", jso.toString());
          
          XMLSerializer xmls = new XMLSerializer();
          xmls.setObjectName("AddItemsRequest");
          xmls.setNamespace(null, "urn:ebay:apis:eBLBaseComponents");
          xmls.setTypeHintsEnabled(false);
          
          String requestxml = xmls.write(jso);
          
          String requestxmlfilename = "AIs.req"
            +"."+((String) tmpuserid)
            +"."+((String) tmpsite)
            +"."+new Integer(Integer.parseInt(tmpchunk.toString())).toString()
            +".xml";
          
          writelog("AddItems/"+requestxmlfilename, requestxml);
          
          validatexml(requestxmlfilename);
          
          updatemessage(email, true,
                        "Listing " + (currentnum+1) + "-" + (currentnum+tmpcnt)
                        + " of " + count + " items to eBay.");
          currentnum += tmpcnt;
          
          Future<String> future = pool18.submit
            (new ApiCallTask(tmpuserid, getSiteID(tmpsite.toString()), requestxml, "AddItems"));
          future.get(); // wait
        }
      }
    }
    
    updatemessage(email, false, "Listed " + count + " items.");
    
    return "";
  }
  
  public String callback(String responsexml) throws Exception {
    
    writelog("AddItems/AIs.res.xml", responsexml);
    
    BasicDBObject responsedbo = convertXML2DBObject(responsexml);
    
    String ack = responsedbo.get("Ack").toString();
    log("Ack:"+ack);
		
		if (!responsedbo.containsField("AddItemResponseContainer")) {
			log("AddItemResponseContainer not exists");
			return "";
		}
		
    // todo: not exist when error is one?
    String classname = responsedbo.get("AddItemResponseContainer").getClass().toString();
    
    BasicDBList dbl = new BasicDBList();
    if (classname.equals("class com.mongodb.BasicDBObject")) {
      dbl.add((BasicDBObject) responsedbo.get("AddItemResponseContainer"));
    } else if (classname.equals("class com.mongodb.BasicDBList")) {
      dbl = (BasicDBList) responsedbo.get("AddItemResponseContainer");
    } else {
      log("Class Error:"+classname);
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
      
      DBCollection coll = db.getCollection("items."+userdbo.getString("_id"));
      
      String itemid    = item.getString("ItemID");
      String starttime = item.getString("StartTime");
      String endtime   = item.getString("EndTime");
      
      BasicDBObject upditem = new BasicDBObject();
      upditem.put("status", "");
      if (itemid != null) {
        upditem.put("org.ItemID", itemid);
        upditem.put("org.Seller.UserID", userid);
        upditem.put("org.ListingDetails.StartTime", starttime);
        upditem.put("org.ListingDetails.EndTime", endtime);
        upditem.put("org.SellingStatus.ListingStatus", "Active");
      }
      
      boolean iserror = false;
      
      // todo: aware <SeverityCode>Warning</SeverityCode>
      if (item.get("Errors") != null) {
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
      apilog.put("callname", "AddItem");
      if (iserror) {
        apilog.put("result", "failure");
      } else {
        apilog.put("result", "success");
      }
      
      DBCollection apilogcoll = db.getCollection("apilog");
      apilogcoll.insert(apilog);
      
      // todo: call GetItem immediately
      /* GetItem */
      if (itemid != null) {
        
        String token = gettoken(email, userid);
        
        BasicDBObject reqdbo = new BasicDBObject();
        reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", token));
        reqdbo.append("WarningLevel",                 "High");
        reqdbo.append("DetailLevel",             "ReturnAll");
        reqdbo.append("IncludeCrossPromotion",        "true");
        reqdbo.append("IncludeItemCompatibilityList", "true");
        reqdbo.append("IncludeItemSpecifics",         "true");
        reqdbo.append("IncludeTaxTable",              "true");
        reqdbo.append("IncludeWatchCount",            "true");
        reqdbo.append("ItemID",                       itemid);
        reqdbo.append("MessageID", getnewtokenmap(email) + " " + userid + " " + itemid);
        
        String requestxml = convertDBObject2XML(reqdbo, "GetItem");
        writelog("GetItem/afterAdditems.req.xml", requestxml);
        
        pool18.submit(new ApiCallTask(userid, 0, requestxml, "GetItem"));
      }
    }
    
    return "";
  }
  
  /**
   * XML Validation
   * ref: http://java.sun.com/developer/technicalArticles/xml/validationxpath/
   */
  private void validatexml(String filename) throws Exception {
    
    // todo: why Country error occures?
    DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
    dbf.setNamespaceAware(true);
    DocumentBuilder parser = dbf.newDocumentBuilder();
    Document document = 
      parser.parse(new File(basedir+"/logs/apicall/AddItems/"+filename));
    
    SchemaFactory factory = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
    
    Source schemaFile = new StreamSource
      (new File(basedir+"/data/ebaySvc.xsd."+configdbo.getString("compatlevel")));
    
    try {
      
      Schema schema = factory.newSchema(schemaFile);
      
      Validator validator = schema.newValidator();
      
      validator.validate(new DOMSource(document));
      
    } catch (SAXException e) {
      System.out.println(e.toString());
    }
    
    return;
  }
  
  /*
  private int getSiteID(String site) throws Exception {
    
    Integer siteid = null;
    
    DBObject row = db.getCollection("US.eBayDetails")
      .findOne(null, new BasicDBObject("SiteDetails", 1));
    BasicDBList sitedetails = (BasicDBList) row.get("SiteDetails");
    for (Object sitedbo : sitedetails) {
      if (site.equals(((BasicDBObject) sitedbo).getString("Site"))) {
        siteid = Integer.parseInt(((BasicDBObject) sitedbo).getString("SiteID"));
        break;
      }
    }
    
    return siteid;
  }
  */
  
  private void expandElements(JSONObject item) throws Exception {
    
    for (Object key : item.keySet()) {
      
      String classname = item.get(key).getClass().toString();
      
      if (classname.equals("class net.sf.json.JSONObject")) {
        
        expandElements((JSONObject) item.get(key));
        
      } else if (classname.equals("class net.sf.json.JSONArray")) {
        
        ((JSONArray) item.get(key)).setExpandElements(true);
        
        for (Object elm : (JSONArray) item.get(key)) {
          if (elm.getClass().toString().equals("class net.sf.json.JSONObject")) {
            expandElements((JSONObject) elm);
          }
        }
      }
    }
    
    return;
  }
}
