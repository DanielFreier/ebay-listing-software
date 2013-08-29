package ebaytool.actions;

import com.mongodb.*;
import com.opensymphony.xwork2.ActionSupport;
import com.opensymphony.xwork2.ActionContext;
import ebaytool.actions.BaseAction;

import java.io.*;
import java.net.Socket;
import java.text.DateFormat;
import java.text.SimpleDateFormat;

import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.Message.RecipientType;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.*;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

import org.apache.commons.lang.RandomStringUtils;
import org.apache.struts2.convention.annotation.Action;
import org.apache.struts2.convention.annotation.Actions;
import org.apache.struts2.convention.annotation.ParentPackage;
import org.apache.struts2.convention.annotation.Result;
import org.apache.struts2.convention.annotation.Results;
import org.bson.types.ObjectId;

@ParentPackage("json-default")
@Result(name="success",type="json")
public class JsonAction extends BaseAction {
  
  private LinkedHashMap<String,Object> json;
  
  public JsonAction() throws Exception {
    json = new LinkedHashMap<String,Object>();
  }
  
  public LinkedHashMap<String,Object> getJson() {
    
    if (session.get("email") != null) {
      if (user.containsField("message")) {
        
        BasicDBObject query = new BasicDBObject();
        query.put("email", session.get("email").toString());
        user = (BasicDBObject) db.getCollection("users").findOne(query);
        
        json.put("message", user.get("message"));
      }
    }
    
    return json;
  }
  
  @Action(value="/json/signup")
  public String signup() throws Exception {
    
    boolean result = false;
    String resultmessage = "signup error";
    
    if (parameters.get("email") != null
        && parameters.get("password") != null
        && parameters.get("password2") != null) {
      
      String email     = ((String[]) parameters.get("email"))[0];
      String password  = ((String[]) parameters.get("password"))[0];
      String password2 = ((String[]) parameters.get("password2"))[0];
      
      if (email.equals("") || password.equals("") || password2.equals("")) {
        
        resultmessage = "Please fill forms.";
        
      } else if (!password.equals(password2)) {
        
        resultmessage = "Password mismatch.";
        
      } else {
        
        /* check existing user */
        BasicDBObject query = new BasicDBObject();
        query.put("email", email);
        
        BasicDBObject user = (BasicDBObject) db.getCollection("users").findOne(query);
        
        if (user != null) {
          
          resultmessage = "Sorry, this email already exists.";
          
        } else {
          
          // todo: password encryption
          String tmptoken = RandomStringUtils.randomAlphanumeric(20);
          
          SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ssZ");
          sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
          Calendar cal = Calendar.getInstance();
          cal.add(Calendar.HOUR, 24);
          String tmptoken_expiration = sdf.format(cal.getTime());
          
          Date now = new Date();
          
          BasicDBObject field = new BasicDBObject();
          field.put("email",     email);
          field.put("password",  password);
          field.put("tmptoken",  tmptoken);
          field.put("tmptoken_expiration", tmptoken_expiration);
          field.put("status",    "temporary registration");
          field.put("language",  "English");
          field.put("timezone",  "GMT-08:00");
          field.put("itemlimit", "100");
          field.put("created",   basetimestamp);
          field.put("lastused",  basetimestamp);
          field.put("created_at",  now);
          field.put("lastused_at", now);
          
          db.getCollection("users").insert(field, WriteConcern.SAFE);
          
          sendmail(email, tmptoken);
          
          result = true;
          
          resultmessage = email;
        }
      }
    }
    
    json.put("resultmessage", resultmessage);
    json.put("result", result);
    
    return SUCCESS;
  }

  @Action(value="/json/forgotpassword")
  public String forgotpassword() throws Exception {
    
    boolean result = false;
    String message = "";
    
    String email = ((String[]) parameters.get("fpemail"))[0];

    BasicDBObject query = new BasicDBObject();
    query.put("email", email);
    BasicDBObject user = (BasicDBObject) db.getCollection("users").findOne(query);
    if (user == null) {
      
      message = "The email address is not registered.";
      
    } else {
      
      String tmptoken = RandomStringUtils.randomAlphanumeric(20);
      
      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ssZ");
      sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
      Calendar cal = Calendar.getInstance();
      cal.add(Calendar.HOUR, 24);
      String tmptoken_expiration = sdf.format(cal.getTime());
      
      BasicDBObject set = new BasicDBObject();
      set.put("tmptoken", tmptoken);
      set.put("tmptoken_expiration", tmptoken_expiration);
      
      db.getCollection("users").update(query, new BasicDBObject("$set", set));
      
      sendfpmail(email, tmptoken);
      
      result = true;
      
      message = email;
    }
    
    json.put("result", result);
    
    return SUCCESS;
  }

  @Action(value="/json/resetpassword")
  public String resetpassword() throws Exception {

    boolean result = false;
    String message = "";
    
    String email     = ((String[]) parameters.get("email"))[0];
    String password  = ((String[]) parameters.get("password"))[0];
    String password2 = ((String[]) parameters.get("password2"))[0];
    
    if (email.equals("") || password.equals("") || password2.equals("")) {
      
      message = "Please fill forms.";
      
    } else if (!password.equals(password2)) {
      
      message = "Password mismatch.";
      
    } else {
      
      BasicDBObject query = new BasicDBObject();
      query.put("email", email);
      BasicDBObject user = (BasicDBObject) db.getCollection("users").findOne(query);
      
      BasicDBObject set = new BasicDBObject();
      set.put("password", password);
      set.put("tmptoken", "");
      set.put("tmptoken_expiration", "");
      
      db.getCollection("users").update(query, new BasicDBObject("$set", set));
      
      result = true;
      
      message = "";
    }
    
    json.put("result", result);
    
    return SUCCESS;
  }
  
  private String sendmail(String email, String tmptoken) throws Exception {
    
    Properties props = new Properties();
    props.put("mail.smtp.host", "localhost");
    props.put("mail.smtp.port", "25");
    
    Session mailSession = Session.getDefaultInstance(props);
    Message simpleMessage = new MimeMessage(mailSession);
    
    InternetAddress fromAddress = null;
    InternetAddress toAddress = null;
    
    fromAddress = new InternetAddress("support@"+configdbo.getString("hostname"));
    toAddress = new InternetAddress(email);
    
    simpleMessage.setFrom(fromAddress);
    simpleMessage.setRecipient(RecipientType.TO, toAddress);
    simpleMessage.setSubject("Thank you for signing up for ListersIn!");
    simpleMessage.setText
      ("Thank you for signing up for ListersIn!\n"
       + "\n"
       + "Please click following link and complete sign up.\n"
       + "\n"
       + "https://" + configdbo.getString("hostname") + "/node/signup_confirm?t=" + tmptoken + "\n"
       + "\n"
       + "\n"
       + "We would like to hear from you!\n"
       + "What kind of functions do you need for third party eBay listing software?\n"
       + "Please just reply to this email:)\n"
       + "\n"
       + "For example:\n"
       + "- Manage multiple eBay accounts.\n"
       + "- Image hosting server.\n"
       + "- Multiple items bulk editing tool. (Find and replace)\n"
       + "- Item duplication checker.\n"
       + "- Manage other ecommerce platforms.(Amazon, etc.)\n"
       + "- Auto relist after item is unsold.\n"
       + "- Scheduled listing without additional fee.\n"
       + "- Keyboard shortcut for faster operation on daily tasks.\n"
       + "\n"
       + "------------------------------------------\n"
       + "ListersIn - eBay Listing Software\n"
       + "http://"+configdbo.getString("hostname")+"/\n"
       + "------------------------------------------\n");
    
    Transport.send(simpleMessage);
    
    return "";
  }

  private String sendfpmail(String email, String tmptoken) throws Exception {
    
    Properties props = new Properties();
    props.put("mail.smtp.host", "localhost");
    props.put("mail.smtp.port", "25");
    
    Session mailSession = Session.getDefaultInstance(props);
    Message simpleMessage = new MimeMessage(mailSession);
    
    InternetAddress fromAddress = null;
    InternetAddress toAddress = null;
    
    fromAddress = new InternetAddress("support@"+configdbo.getString("hostname"));
    toAddress = new InternetAddress(email);
    
    simpleMessage.setFrom(fromAddress);
    simpleMessage.setRecipient(RecipientType.TO, toAddress);
    simpleMessage.setSubject("Password reset for ListersIn");
    simpleMessage.setText
      ("This mail was sent you for reset password.\n"
       + "\n"
       + "Please click following link and input your new password.\n"
       + "\n"
       + "http://"+configdbo.getString("hostname")+"/page/reset_password?t="+tmptoken+"\n"
       + "\n"
       + "------------------------------------------\n"
       + "ListersIn - eBay Listing Software\n"
       + "http://"+configdbo.getString("hostname")+"/\n"
       + "------------------------------------------\n");
    
    Transport.send(simpleMessage);
    
    return "";
  }
  
  /* todo: redirect to ebay */
  @Action(value="/json/addaccount")
  public String addaccount() throws Exception {
    
    /* GetSessionID */
    String[] args = {"GetSessionID", session.get("email").toString()};
    String sessionid = writesocket(args);
    
    /* return JSON */
    String url = configdbo.getString("signinurl")
      + "?SignIn"
      + "&runame=" + configdbo.getString("runame")
      + "&SessID=" + sessionid;
    
    json.put("url", url);
    
    return SUCCESS;
  }
  
  @Action(value="/json/removeaccount")
  public String removeaccount() throws Exception {
    
    // todo: check userid exists in userids2 array.
    String userid = parameters.get("userid")[0];
    
    db.getCollection("items." + user.getString("_id")).remove
      (new BasicDBObject("UserID", userid));
    
    db.getCollection("users").update
      (new BasicDBObject("email", user.getString("email")),
       new BasicDBObject("$pull", new BasicDBObject("userids2",
                                                    new BasicDBObject("username", userid))));
    
    updatemessage(user.getString("email"), false, "Removed eBay account " + userid + ".");
    
    return SUCCESS;
  }
  
  @Action(value="/json/items")
  public String items() throws Exception {
    
    /* Save filter for next use */
    String filterform = ((String[]) parameters.get("json"))[0];
    BasicDBObject filterdbo = (BasicDBObject) com.mongodb.util.JSON.parse(filterform);
    
    db.getCollection("users").update
      (new BasicDBObject("_id", new ObjectId(user.getString("_id"))),
       new BasicDBObject("$set", new BasicDBObject("filter", filterdbo)));
    
    json = _items();
    
    return SUCCESS;
  }
  
  private LinkedHashMap<String,Object> _items() throws Exception {
    
    LinkedHashMap<String,Object> itemjson = new LinkedHashMap<String,Object>();
    
    //LinkedHashMap<String,Object> items = new LinkedHashMap<String,Object>();
    ArrayList<BasicDBObject> items = new ArrayList<BasicDBObject>();
    
    LinkedHashMap<String,BasicDBObject> sellingquery = getsellingquery();
    
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    int limit = 40;
    int offset = 0;
    if (parameters.containsKey("limit"))
      limit = Integer.parseInt(((String[]) parameters.get("limit"))[0]);
    if (parameters.containsKey("offset"))
      offset = Integer.parseInt(((String[]) parameters.get("offset"))[0]);
    
    BasicDBObject query = getFilterQuery();
    
    BasicDBObject field = new BasicDBObject();
    
    field.put("error",                           1);
    field.put("membermessages",                  1);
    field.put("message",                         1);
    field.put("opt",                             1);
    field.put("status",                          1);
    field.put("UserID",                          1);
    
    field.put("mod.ListingType",                 1);
    field.put("mod.PictureDetails.GalleryURL",   1);
    field.put("mod.PictureDetails.PictureURL",   1);
    field.put("mod.Quantity",                    1);
    field.put("mod.ScheduleTime",                1);
    field.put("mod.Site",                        1);
    field.put("mod.StartPrice",                  1);
    field.put("mod.Title",                       1);
    
    field.put("org.HitCount",                    1);
    field.put("org.ItemID",                      1);
    field.put("org.ListingDetails.EndTime",      1);
    field.put("org.ListingDetails.HasUnansweredQuestions",  1);
    field.put("org.ListingDetails.StartTime",    1);
    field.put("org.ListingDetails.ViewItemURL",  1);
    field.put("org.Seller.UserID",               1);
    field.put("org.SellingStatus.BidCount",      1);
    field.put("org.SellingStatus.CurrentPrice",  1);
    field.put("org.SellingStatus.ListingStatus", 1);
    field.put("org.SellingStatus.QuantitySold",  1);
    field.put("org.TimeLeft",                    1);
    field.put("org.WatchCount",                  1);
    
    if (parameters.get("bulk") != null) {
      field = null;
    }
    
    BasicDBObject sort = new BasicDBObject();
    
    if (parameters.get("sortfield") != null) {
      String sortfield = ((String[]) parameters.get("sortfield"))[0];
      Integer sortorder = Integer.parseInt(((String[]) parameters.get("sortorder"))[0]);
      sort.put(sortfield, sortorder);
      sort.put("_id", -1);
    }
    
    /* check duplicate items */
    String option = "";
    if (parameters.containsKey("option")) {
      option = parameters.get("option")[0];
    }
    if (option.equals("checkduplicateitems")) {
      
      BasicDBObject gkey = new BasicDBObject();
      gkey.put("mod.Title", 1);
      gkey.put("UserID", 1);
      
      BasicDBObject gcond = new BasicDBObject();
      //gcond.put("org.SellingStatus.ListingStatus", "Active");
      
      BasicDBObject ginit = new BasicDBObject();
      ginit.put("count", 0);
      
      BasicDBList gdbl = new BasicDBList();
      DBObject gresult = coll.group(gkey, gcond, ginit, "function(o,p){p.count++;}");
      for (Object go : gresult.keySet()) {
        BasicDBObject gd = (BasicDBObject) gresult.get(go.toString());
        if (gd.getInt("count") <= 1) continue;
        
        BasicDBObject gdq = (BasicDBObject) gd.copy();
        gdq.removeField("count");
        
        gdbl.add(gdq);
      }
      
      query.put("$or", gdbl);
      
      sort = new BasicDBObject();
      sort.put("mod.Title", 1);
      sort.put("UserID", 1);
      sort.put("org.ListingDetails.EndTime", 1);
    }
    
    Calendar calendar = Calendar.getInstance();
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    SimpleDateFormat formatter = new SimpleDateFormat("h:mm a");
    Date now = new Date();
    //String today = sdf.format(calendar.getTime());
    
    sdf.setLenient(false);
    formatter.setLenient(false);
    
    BasicDBObject paths = new BasicDBObject();
    BasicDBObject bulksites = new BasicDBObject();
    
    /* each items */
    DBCursor cur = coll.find(query, field).limit(limit).skip(offset).sort(sort);
    itemjson.put("cnt", cur.count());
    while (cur.hasNext()) {
      
      DBObject item = cur.next();
      DBObject mod = (DBObject) item.get("mod");
      
      BasicDBObject tmp = new BasicDBObject();
      
      item.put("id", item.get("_id").toString());
      
      String id = item.get("_id").toString();
      String site = mod.get("Site").toString();
      
      /* StartPrice */
      if (mod.containsField("StartPrice")) {
        BasicDBObject sp = (BasicDBObject) mod.get("StartPrice");
        //Float startprice = Float.parseFloat(sp.get("#text").toString());
        //item.put("price", sp.get("@currencyID")+" "+startprice.intValue());
        if (sp.containsField("@currencyID")) {
          item.put("price", sp.getString("@currencyID") + " " + sp.getString("#text"));
        } else if (sp.containsField("#text")) {
          item.put("price", sp.getString("#text"));
        } else {
          item.put("price", "(error)");
        }
      }
      
      /* scheduled time */
      if (item.containsField("setting")) {
        if (((DBObject) item.get("setting")).containsField("schedule")) {
          
          String schedule = ((BasicDBObject) item.get("setting")).getString("schedule");
          
          sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
          sdf.applyPattern("yyyy-MM-dd HH:mm:ss");
          
          Date scheduletime = sdf.parse(schedule);
          
          sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
          sdf.applyPattern("yyyy-MM-dd HH:mm");
          
          item.put("setting.schedule", sdf.format(scheduletime));
        }
      }
      
      /* ScheduleTime */
      if (mod.containsField("ScheduleTime")) {
        
        /* Scheduled on eBay but not submitted yet */
        Date scheduletime = (Date) mod.get("ScheduleTime");
        
        sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
        sdf.applyPattern("MMM d HH:mm");
        tmp.put("ScheduleTime", sdf.format(scheduletime));
        
      } else if (item.containsField("org")) {
        
        DBObject org = (DBObject) item.get("org");
        BasicDBObject listingdetails = (BasicDBObject) org.get("ListingDetails");
        
        /* StartTime */
        if (listingdetails.containsField("StartTime")) {
          
          sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
          sdf.applyPattern("yyyy-MM-dd HH:mm:ss");
          
          formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
          formatter.applyPattern("yyyy-MM-dd");
          
          Date dfstarttime = null;
          
          String classname = listingdetails.get("StartTime").getClass().toString();
          if (classname.equals("class java.util.Date")) {
            dfstarttime = (Date) listingdetails.get("StartTime");
          } else {
            String starttime = listingdetails.get("StartTime").toString();
            dfstarttime = sdf.parse(starttime.replace("T", " ").replace(".000Z", ""));
          }
          
          sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
          formatter.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
          
          formatter.applyPattern("MMM d HH:mm");
          
          item.put("starttime", formatter.format(dfstarttime));
          
          if (dfstarttime.compareTo(now) > 0) {
            item.put("schedule_local", formatter.format(dfstarttime));
            tmp.put("ScheduleTime", formatter.format(dfstarttime));
          }
        }
        
        /* EndTime */
        if (listingdetails.containsField("EndTime")) {
          
          sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
          sdf.applyPattern("yyyy-MM-dd HH:mm:ss");
          
          formatter.setTimeZone(TimeZone.getTimeZone("UTC"));
          formatter.applyPattern("yyyy-MM-dd");
          
          Date dfendtime = null;
          
          String classname = 
            ((DBObject) org.get("ListingDetails")).get("EndTime").getClass().toString();
          if (classname.equals("class java.util.Date")) {
            dfendtime = (Date) listingdetails.get("EndTime");
          } else {
            String endtime = listingdetails.get("EndTime").toString();
            dfendtime = sdf.parse(endtime.replace("T", " ").replace(".000Z", ""));
          }
          
          sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
          formatter.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
          
          formatter.applyPattern("MMM d HH:mm");
          
          item.put("endtime", formatter.format(dfendtime));
        }
        
        /* CurrentPrice */
        BasicDBObject sellingstatus = (BasicDBObject) org.get("SellingStatus");
        BasicDBObject currentprice = (BasicDBObject) sellingstatus.get("CurrentPrice");
        item.put("currentprice", 
                 currentprice.getString("@currencyID") + " " + currentprice.getString("#text"));
        
        if (parameters.get("bulk") != null) {
          if (mod.containsField("PrimaryCategory")) {
            Integer categoryid = Integer.parseInt
              (((BasicDBObject) mod.get("PrimaryCategory")).getString("CategoryID"));
            List path = categorypath(mod.get("Site").toString(), categoryid);
            log.debug(path);
          }
        }
        
      }
      
      /* adjust timezone of membermessages */
      if (item.containsField("membermessages")) {
        for (Object mme : (BasicDBList) item.get("membermessages")) {
          BasicDBObject membermessage = (BasicDBObject) mme;
          
          String classname = membermessage.get("CreationDate").getClass().toString();
          if (classname.equals("class java.util.Date")) {
            Date creationdate = (Date) membermessage.get("CreationDate");
            sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
            sdf.applyPattern("yyyy-MM-dd HH:mm");
            membermessage.put("CreationDate", sdf.format(creationdate));
          }
        }
      }
      
      item.put("tmp", tmp);
      item.removeField("_id");
      
      //items.put(id, item);
      items.add((BasicDBObject) item);
      
    } // while
    
    itemjson.put("items", items);
    itemjson.put("paths", paths);
    
    return itemjson;
  }
  
  @Actions({
    @Action(value="/json/item"),
    @Action(value="/json/save-item"),
  })
  public String item() throws Exception {
    
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    /* handling post parameters */
    String id = parameters.get("id")[0];
    
    /* query */
    BasicDBObject query = new BasicDBObject();
    query.put("_id", new ObjectId(id));
    
    /* execute query */
    BasicDBObject item = (BasicDBObject) coll.findOne(query);
    BasicDBObject mod  = (BasicDBObject) item.get("mod");
    BasicDBObject org  = new BasicDBObject();
    BasicDBObject opt  = new BasicDBObject();
    if (item.containsField("org")) {
      org = (BasicDBObject) item.get("org");
    } else {
      item.put("org", org);
    }
    if (item.containsField("opt")) {
      opt = (BasicDBObject) item.get("opt");
    } else {
      item.put("opt", opt);
    }
    
    item.put("id", item.get("_id").toString());
    
    String site = mod.getString("Site");
    
    if (mod.containsField("PrimaryCategory")) {
      
      /* categorypath */
      // todo: update old categoryid to current active categoryid
      Integer categoryid = Integer.parseInt
        (((BasicDBObject) mod.get("PrimaryCategory")).getString("CategoryID"));
      
      categoryid = mapcategoryid(site, categoryid);
      ((BasicDBObject) mod.get("PrimaryCategory")).put("CategoryID", categoryid.toString());
      
      List path = categorypath(site, categoryid);
      item.put("categorypath", path);
      
      /* grandchildren */
      String[] pathstr = new String[path.size()+1];
      pathstr[0] = "0";
      for (int i = 0; i < path.size(); i++) {
        pathstr[i+1] = path.get(i).toString();
      }
      
      BasicDBObject children2 = children2(site, pathstr);
      
      LinkedHashMap<Integer,String> path2 = categorypath2(site, categoryid);
      item.put("categorypath2", path2);
      
      json.put("Categories", children2.get("Categories"));
      
    } else {
      
      /* grandchildren */
      String[] pathstr = {"0"};
      BasicDBObject children2 = children2(site, pathstr);
      json.put("Categories", children2.get("Categories"));
      
    }
    
    if (mod.containsField("SecondaryCategory")) {
      
      /* categorypath */
      // todo: update old categoryid to current active categoryid
      Integer categoryid = Integer.parseInt
        (((BasicDBObject) mod.get("SecondaryCategory")).getString("CategoryID"));
      
      categoryid = mapcategoryid(site, categoryid);
      ((BasicDBObject) mod.get("SecondaryCategory")).put("CategoryID", categoryid.toString());
      
      List path = categorypath(site, categoryid);
      item.put("secondarycategorypath", path);
      
      /* grandchildren */
      String[] pathstr = new String[path.size()+1];
      pathstr[0] = "0";
      for (int i = 0; i < path.size(); i++) {
        pathstr[i+1] = path.get(i).toString();
      }
      
      BasicDBObject children2 = children2(site, pathstr);
      
      LinkedHashMap<Integer,String> path2 = categorypath2(site, categoryid);
      item.put("secondarycategorypath2", path2);
      
      json.put("SecondaryCategories", children2.get("Categories"));
      
    } else {
      
      /* grandchildren */
      String[] pathstr = {"0"};
      BasicDBObject children2 = children2(site, pathstr);
      json.put("SecondaryCategories", children2.get("Categories"));
      
    }
    
    /* ListingDesigner */
    json.put("DescriptionTemplate", "");
    if (mod.containsField("ListingDesigner")) {
      BasicDBObject listingdesigner = (BasicDBObject) mod.get("ListingDesigner");
      if (listingdesigner.containsField("ThemeID")) {
        String themeid = listingdesigner.getString("ThemeID");
        
        BasicDBObject desctmpl =
          (BasicDBObject) db.getCollection
          (site+".DescriptionTemplates.DescriptionTemplate")
          .findOne(new BasicDBObject("ID", themeid));
        
        String groupid = desctmpl.getString("GroupID");
        item.put("ListingDesigner", new BasicDBObject("GroupID", groupid));
        
        json.put("DescriptionTemplate", _descriptiontemplate(site, groupid));
      }
    }
    
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    sdf.setLenient(false);
    
    /* adjust timezone of membermessages */
    /*
    if (item.containsField("membermessages")) {
      BasicDBObject membermessages = (BasicDBObject) item.get("membermessages");
      
      for (Object tmpkey : membermessages.keySet()) {
        BasicDBObject membermessage = (BasicDBObject) membermessages.get(tmpkey);
        
        String creationdate = membermessage.getString("CreationDate");
        
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        
        Date creationdate_l = sdf.parse(creationdate.replace("T", " ").replace(".000Z", ""));
        
        sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
        
        membermessage.put("creationdate_l", sdf.format(creationdate_l));
      }
    }
    */
    
    /* ScheduleTime */
    if (mod.containsField("ScheduleTime")) {
      
      /* Scheduled on eBay but not submitted yet */
      Date scheduletime = (Date) mod.get("ScheduleTime");
      
      sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
      sdf.applyPattern("yyyy-MM-dd HH:mm");
      mod.put("ScheduleTime", sdf.format(scheduletime));
      
    } else if (org.containsField("ListingDetails")) {
      
      /* Imported scheduled item from ebay */
      BasicDBObject listingdetails = (BasicDBObject) org.get("ListingDetails");
      
      if (listingdetails.containsField("StartTime")) {
        Date starttime = (Date) listingdetails.get("StartTime");
        Date now = new Date();
        if (starttime.compareTo(now) > 0) {
          sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
          sdf.applyPattern("yyyy-MM-dd HH:mm");
          mod.put("ScheduleTime", sdf.format(starttime));
          opt.put("ScheduleType", "ebay");
        }
      }
      
    } else if (opt.containsField("ScheduleTime")) {
      
      /* Scheduled on ListersIn */
      Date scheduletime = (Date) opt.get("ScheduleTime");
      
      sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
      sdf.applyPattern("yyyy-MM-dd HH:mm");
      mod.put("ScheduleTime", sdf.format(scheduletime));
      
    }
    
    /* Remove fields */
    item.removeField("_id");
    
    BasicDBObject ebaydetails = 
      (BasicDBObject) db.getCollection(site+".eBayDetails").findOne();
    
    BasicDBObject categoryfeatures =
      (BasicDBObject) db.getCollection(site+".CategoryFeatures").findOne();
    
    json.put("item",             item);
    json.put("eBayDetails",      ebaydetails);
    json.put("CategoryFeatures", categoryfeatures);
    json.put("ThemeGroup",       themegroup(site));
    
    return SUCCESS;
  }
  
  @Action(value="/json/save")
  public String save() throws Exception {
    
    String id   = ((String[]) parameters.get("id"))[0];
    String form = ((String[]) parameters.get("json"))[0];
    
    BasicDBObject item            = (BasicDBObject) com.mongodb.util.JSON.parse(form);
    BasicDBObject mod             = (BasicDBObject) item.get("mod");
    BasicDBObject opt             = (BasicDBObject) item.get("opt");
    BasicDBObject setting         = (BasicDBObject) item.get("setting");
    BasicDBObject shippingdetails = (BasicDBObject) item.get("ShippingDetails");
    
    /* ScheduleTime */
    if (mod.containsField("ScheduleTime")) {
      
      String scheduletimestr = mod.getString("ScheduleTime");
      
      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
      sdf.setLenient(false);
      sdf.setTimeZone(TimeZone.getTimeZone(user.getString("timezone")));
      
      Date scheduletime = sdf.parse(scheduletimestr);
      
      sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
      sdf.applyPattern("yyyy-MM-dd HH:mm:ss");
      
      String scheduletype = opt.getString("ScheduleType");
      if (scheduletype.equals("ebay")) {
        mod.put("ScheduleTime", scheduletime);
        opt.removeField("ScheduleTime");
      } else if (scheduletype.equals("listersin")) {
        mod.removeField("ScheduleTime");
        opt.put("ScheduleTime", scheduletime);
      } else {
        mod.removeField("ScheduleTime");
        opt.removeField("ScheduleTime");
        opt.removeField("ScheduleType");
      }
    } else {
      mod.removeField("ScheduleTime");
      opt.removeField("ScheduleTime");
      opt.removeField("ScheduleType");
    }
    
    /* Copied from GetItem.java */
    BasicDBList doublefields = (BasicDBList) configdbo.get("doublefield");
    for (Object fieldname : doublefields) {
      convertfield(mod, fieldname.toString());
    }
    
    BasicDBList intfields = (BasicDBList) configdbo.get("intfield");
    for (Object fieldname : intfields) {
      convertint(mod, fieldname.toString());
    }
    
    /*
    BasicDBList datefields = (BasicDBList) configdbo.get("datefield");
    for (Object fieldname : datefields) {
      convertdate(mod, fieldname.toString());
    }
    */
    
    /* ShippingType */
    // todo: check through here
    /*
    if (item.containsField("ShippingDetails")) {
      BasicDBObject shippingtype = (BasicDBObject) shippingdetails.get("ShippingType");
      
      String stype = getShippingType(shippingtype.getString("domestic"),
                                     shippingtype.getString("international"));
      
      if (!mod.containsField("ShippingDetails")) {
        mod.put("ShippingDetails", new BasicDBObject());
      }
      ((BasicDBObject) mod.get("ShippingDetails")).put("ShippingType", stype);
    }
    */
    
    boolean orgexists = false;
    
    /* items collection */
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    if (id.equals("newitem0")) {
      
      /* save new item */
      ObjectId newid = new ObjectId();
      id = newid.toString();
      
      parameters.get("id")[0] = newid.toString();
      
      BasicDBObject newitem = new BasicDBObject();
      newitem.put("_id", newid);
      newitem.put("mod", mod);
      newitem.put("opt", opt);
      newitem.put("UserID", item.getString("UserID"));
      
      BasicDBList logdbl = new BasicDBList();
      logdbl.add(new BasicDBObject(basetimestamp, "Created by user"));
      newitem.put("log", logdbl);
      
      coll.insert(newitem, WriteConcern.SAFE);
      
      /* save before and after file for diff */
      DiffLogger dl = new DiffLogger();
      dl.savediff("newitem0", newitem.toString(), newitem.toString(), basedir+"/logs/diff");
      
    } else {
      
      /* update existing item */
      BasicDBObject query = new BasicDBObject();
      query.put("_id", new ObjectId(id));
      
      BasicDBObject before = (BasicDBObject) coll.findOne(query);
      
      BasicDBObject set = new BasicDBObject();
      set.put("mod", mod);
      set.put("opt", opt);
      set.put("UserID", item.getString("UserID"));
      
      BasicDBObject update = new BasicDBObject();
      update.put("$set", set);
      update.append("$push", new BasicDBObject
                    ("log", new BasicDBObject(basetimestamp, "Saved by user")));
      
      coll.update(query, update);
      
      BasicDBObject after  = (BasicDBObject) coll.findOne(query);
      
      /* save before and after file for diff */
      DiffLogger dl = new DiffLogger();
      dl.savediff(id, before.toString(), after.toString(), basedir+"/logs/diff");
      
      if (before.containsField("org")) {
        orgexists = true;
      }
    }
    
    if (!orgexists && !user.getString("email").equals("demo@listers.in")) {
      
      /* VerifyAddItem */
      String taskid = "verifyadditem_";
      taskid += basetimestamp.replace(" ", "_").replace("+0000", "").replace(":", "-");
      
      BasicDBObject query = new BasicDBObject();
      query.put("_id", new ObjectId(id));
      
      BasicDBObject update = new BasicDBObject();
      update.put("$set", new BasicDBObject("status", taskid));
      
      db.getCollection("items."+user.getString("_id")).update(query, update);
      
      String[] args = {"VerifyAddItem", user.getString("email"), taskid};
      String verifyresult = writesocket(args);
      
    }
    
    updatemessage(user.getString("email"), false, "Saved.");
    
    // memo: The id "newitem0" seem to be replaced with new ObjectId automatically.
    return "item";
  }
  
  @Action(value="/json/copy")
  public String copy() throws Exception {
    
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    BasicDBObject query = getFilterQuery();
    
    BasicDBObject field = new BasicDBObject();
    field.put("org.ItemID", 0);
    
    Integer d = 0;
    
    // todo: sort result
    ArrayList<DBObject> newdblist = new ArrayList<DBObject>();
    DBCursor cur = coll.find(query).snapshot();
    while (cur.hasNext()) {
      BasicDBObject item = (BasicDBObject) cur.next();
      
      // remove fields
      item.removeField("_id");
      item.removeField("org");
      item.removeField("membermessages");
      item.removeField("log");
      
      newdblist.add((BasicDBObject) item.copy());
    }
    
    WriteResult res = coll.insert(newdblist, WriteConcern.SAFE);
    
    return SUCCESS;
  }
  
  @Action(value="/json/delete")
  public String delete() throws Exception {
    
    BasicDBObject query = getFilterQuery();
        
    db.getCollection("items."+user.getString("_id")).remove(query);
    
    return SUCCESS;
  }
  
  @Action(value="/json/add")
  public String add() throws Exception {
    
    // todo: timezone doesn't work
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd_hh-mm-ss");
    sdf.setTimeZone(TimeZone.getTimeZone("Japan/Tokyo"));
    Date now = new Date();
    String timestamp = sdf.format(now);
    
    ArrayList<ObjectId> ids = new ArrayList<ObjectId>();
    for (String id : (String[]) parameters.get("id")) {
      ids.add(new ObjectId(id));
    }
    
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    BasicDBObject query = new BasicDBObject();
    query.put("_id", new BasicDBObject("$in", ids));
    
    Long count = coll.count(query);
    updatemessage(user.getString("email"), true, "Listing " + count + " items.");
    
    BasicDBObject update = new BasicDBObject();
    update.put("$set", new BasicDBObject("status", "add_"+timestamp));
    
    WriteResult result = coll.update(query, update, false, true);
    
    String[] args = {"AddItems", session.get("email").toString(), "add_"+timestamp};
    writesocket_async(args);
    
    return SUCCESS;
  }
  
  @Action(value="/json/relist")
  public String relist() throws Exception {
    
    // todo: timezone doesn't work
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd_hh-mm-ss");
    sdf.setTimeZone(TimeZone.getTimeZone("Japan/Tokyo"));
    Date now = new Date();
    String timestamp = sdf.format(now);
    
    ArrayList<ObjectId> ids = new ArrayList<ObjectId>();
    for (String id : (String[]) parameters.get("id")) {
      ids.add(new ObjectId(id));
    }
    
    BasicDBObject query = new BasicDBObject();
    query.put("_id", new BasicDBObject("$in", ids));
    query.put("status", new BasicDBObject("$ne", "relist"));
    
    BasicDBObject update = new BasicDBObject();
    update.put("$set", new BasicDBObject("status", "relist_"+timestamp));
    
    WriteResult result = db.getCollection("items."+user.getString("_id"))
      .update(query, update, false, true);
    
    json.put("result", result);
    
    Socket socket = new Socket("localhost", daemonport);
    PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
    out.println("RelistItem\n"
                    + session.get("email") + "\n"
                    + "relist_"+timestamp + "\n"
                    + "\n");
    out.close();
    socket.close();
    
    return SUCCESS;
  }
  
  @Action(value="/json/verifyadditem")
  public String verifyadditem() throws Exception {
    
    ArrayList<ObjectId> ids = new ArrayList<ObjectId>();
    for (String id : (String[]) parameters.get("id")) {
      ids.add(new ObjectId(id));
    }
    
    String taskid = "verify_";
    taskid += basetimestamp.replace(" ", "_").replace("+0000", "").replace(":", "-");
    
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    BasicDBObject query = new BasicDBObject();
    query.put("_id", new BasicDBObject("$in", ids));
    
    Long count = coll.count(query);
    updatemessage(user.getString("email"), true, "Verifing " + count + " items.");
    
    BasicDBObject update = new BasicDBObject();
    update.put("$set", new BasicDBObject("status", taskid));
    
    WriteResult result = coll.update(query, update, false, true);
    
    String[] args = {"VerifyAddItem", session.get("email").toString(), taskid};
    writesocket_async(args);
    
    return SUCCESS;
  }
  
  @Action(value="/json/revise")
  public String revise() throws Exception {
    
    ArrayList<ObjectId> ids = new ArrayList<ObjectId>();
    for (String id : (String[]) parameters.get("id")) {
      ids.add(new ObjectId(id));
    }
    
    String taskid = "revise_";
    taskid += basetimestamp.replace(" ", "_").replace("+0000", "").replace(":", "-");
    
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    BasicDBObject query = new BasicDBObject();
    query.put("_id", new BasicDBObject("$in", ids));
    
    Long count = coll.count(query);
    updatemessage(user.getString("email"), true, "Revising " + count + " items...");
    
    BasicDBObject update = new BasicDBObject();
    update.put("$set", new BasicDBObject("status", taskid));
    
    WriteResult result = coll.update(query, update, false, true);
    
    String[] args = {"ReviseItem", session.get("email").toString(), taskid};
    writesocket_async(args);
    
    return SUCCESS;
  }
  
  @Action(value="/json/import")
  public String importitems() throws Exception {
    
    String email     = user.get("email").toString();
    String userid    = ((String[]) parameters.get("userid"))[0];
    String daterange = ((String[]) parameters.get("daterange"))[0];
    String datestart = ((String[]) parameters.get("datestart"))[0];
    String dateend   = ((String[]) parameters.get("dateend"))[0];
    
    /*
    SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
    Calendar cal = Calendar.getInstance();
    cal.add(Calendar.DATE, 1);
    String end   = formatter.format(cal.getTime());
    cal.add(Calendar.DATE, -29); // max 119
    String start = formatter.format(cal.getTime());
    */
    
    /* GetSellerList */
    String[] args = {"GetSellerList", email, userid, daterange, datestart, dateend, "ReturnAll"};
    writesocket_async(args);
        
    /*
    cal = Calendar.getInstance();
    cal.add(Calendar.DATE, 0);
    end   = formatter.format(cal.getTime());
    cal.add(Calendar.DATE, -30);
    start = formatter.format(cal.getTime());
    */
    
    /* GetMemberMessages */
    args = new String[]{"GetMemberMessages", email, userid,
                        datestart+"T00:00:00.000Z",
                        dateend+"T00:00:00.000Z"};
    writesocket_async(args); // not wait
    
    return SUCCESS;
  }
  
  @Action(value="/json/end")
  public String end() throws Exception {
    
    ArrayList<ObjectId> ids = new ArrayList<ObjectId>();
    for (String id : (String[]) parameters.get("id")) {
      ids.add(new ObjectId(id));
    }
    
    String taskid = "end_";
    taskid += basetimestamp.replace(" ", "_").replace("+0000", "").replace(":", "-");
    
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    BasicDBObject query = new BasicDBObject();
    query.put("_id", new BasicDBObject("$in", ids));
    
    Long count = coll.count(query);
    updatemessage(user.getString("email"), true, "Ending " + count + " items.");
    
    // todo: disable auto relisting.
    BasicDBObject update = new BasicDBObject();
    update.put("$set", new BasicDBObject("status", taskid));
    
    WriteResult result = coll.update(query, update, false, true);
    
    String[] args = {"EndItems", session.get("email").toString(), taskid};
    writesocket_async(args);
    
    return SUCCESS;
  }
  
  @Action(value="/json/findproducts")
  public String findproducts() throws Exception {
    
    String site = "";
    String findtype = "";
    String keyword = "";
    
    site = ((String[]) parameters.get("site"))[0];
    findtype = ((String[]) parameters.get("findtype"))[0];
    
    if (parameters.containsKey("keyword")) {
      keyword = ((String[]) parameters.get("keyword"))[0];
    } else {
      return SUCCESS;
    }
    
    /* GetSuggestedCategories */
    String[] args = {"GetSuggestedCategories", site, keyword};
    String categoryresult = writesocket(args);
    
    /* FindProducts */
    String[] args2 = {"FindProducts", site, findtype, keyword};
    String result = writesocket(args2);
    
    XMLSerializer xmlSerializer = new XMLSerializer(); 
    xmlSerializer.setTypeHintsEnabled(false);
    
    net.sf.json.JSON categoryjson = xmlSerializer.read(categoryresult);
    BasicDBObject categorydbo =
      (BasicDBObject) com.mongodb.util.JSON.parse(categoryjson.toString());
    
    net.sf.json.JSON tmpjson = xmlSerializer.read(result);
    BasicDBObject dbo =
      (BasicDBObject) com.mongodb.util.JSON.parse(tmpjson.toString());
    
    json.put("categories", categorydbo);
    json.put("result", dbo);
    
    return SUCCESS;
  }
  
  @Action(value="/json/summary")
  public String summary() throws Exception {
    
    json.put("summary", summarydata());
    
    return SUCCESS;
  }
  
  @Action(value="/json/settings")
  public String settings() throws Exception {
        
    if (parameters.get("timezone") != null) {
      
      String timezone = ((String[]) parameters.get("timezone"))[0];
      
      db.getCollection("users").update
        (new BasicDBObject("_id", new ObjectId(user.getString("_id"))),
         new BasicDBObject("$set", new BasicDBObject("timezone", timezone)));
    }
    
    BasicDBObject settings = new BasicDBObject();
    settings.put("language",   user.getString("language"));
    settings.put("timezone",   user.getString("timezone"));
    settings.put("expiration", user.getString("expiration"));
    settings.put("itemlimit",  user.getString("itemlimit"));
    settings.put("status",     user.getString("status"));
    settings.put("email",      user.getString("email"));
    
    // todo: convert timezone of token expiration
    // todo: remove tokens etc...
    BasicDBList userids2 = new BasicDBList();
    if (user.containsField("userids2")) {
      for (Object useridobj : (BasicDBList) user.get("userids2")) {
        
        BasicDBObject tmp = (BasicDBObject) ((BasicDBObject) useridobj).copy();
        tmp.removeField("@xmlns");
        tmp.removeField("Ack");
        tmp.removeField("CorrelationID");
        tmp.removeField("Version");
        tmp.removeField("Build");
        tmp.removeField("eBayAuthToken");
        
        userids2.add(tmp);
      }
    }
    settings.put("userids2", userids2);
    
    json.put("settings", settings);
    
    return SUCCESS;
  }
  
  public LinkedHashMap<String,Object> summarydata() throws Exception {
    LinkedHashMap<String,Object> summarydata = new LinkedHashMap<String,Object>();
    
    if (!user.containsField("userids2")) {
      return summarydata;
    }
    
    LinkedHashMap<String,BasicDBObject> selling = getsellingquery();
    
    ArrayList<String> userids = new ArrayList<String>();
    for (Object useridobj : (BasicDBList) user.get("userids2")) {
      userids.add(((BasicDBObject) useridobj).getString("username"));
    }
    
    DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    LinkedHashMap<String,Long> allsummary = new LinkedHashMap<String,Long>();
    for (String k : selling.keySet()) {
      BasicDBObject query = new BasicDBObject();
      query = selling.get(k);
      query.put("UserID", new BasicDBObject("$in", userids));
      
      Long cnt = coll.count(query);
      allsummary.put(k, cnt);
    }
    summarydata.put("alluserids", allsummary);
    
    for (String u : userids) {
      LinkedHashMap<String,Long> summary = new LinkedHashMap<String,Long>();
      for (String k : selling.keySet()) {
        BasicDBObject query = new BasicDBObject();
        query = selling.get(k);
        query.put("UserID", u);
        
        Long cnt = coll.count(query);
        summary.put(k, cnt);
      }
      summarydata.put(u, summary);
    }
    
    return summarydata;
  }
  
  private LinkedHashMap<String,BasicDBObject> themegroup(String site) {
    
    LinkedHashMap<String,BasicDBObject> rows = new LinkedHashMap<String,BasicDBObject>();
    
    DBCursor cur = db.getCollection(site+".DescriptionTemplates.ThemeGroup").find();
    while (cur.hasNext()) {
      BasicDBObject row = (BasicDBObject) cur.next();
      String id = row.get("_id").toString();
      rows.put(id, row);
    }    
    
    return rows;
  }
  
  private LinkedHashMap<String,BasicDBObject> getsellingquery() {
    
    BasicDBObject allitems   = new BasicDBObject();
    BasicDBObject scheduled  = new BasicDBObject();
    BasicDBObject active     = new BasicDBObject();
    BasicDBObject sold       = new BasicDBObject();
    BasicDBObject unsold     = new BasicDBObject();
    BasicDBObject unanswered = new BasicDBObject();
    BasicDBObject saved      = new BasicDBObject();
    
    Date now = new Date();
    ArrayList<BasicDBObject> or = new ArrayList<BasicDBObject>();
    or.add(new BasicDBObject("mod.ScheduleTime", new BasicDBObject("$gt", now)));
    or.add(new BasicDBObject("opt.ScheduleTime", new BasicDBObject("$gt", now)));
    or.add(new BasicDBObject("org.ListingDetails.StartTime", new BasicDBObject("$gt", now)));
    scheduled.put("$or", or);
    
    active.put("org.ItemID", new BasicDBObject("$exists", 1));
    active.put("org.SellingStatus.ListingStatus", "Active");
    active.put("org.ListingDetails.StartTime", new BasicDBObject("$lt", now));
    
    sold.put("org.ItemID", new BasicDBObject("$exists", 1));
    sold.put("org.SellingStatus.QuantitySold", new BasicDBObject("$gte", 1));
    
    unsold.put("org.ItemID", new BasicDBObject("$exists", 1));
    unsold.put("org.SellingStatus.ListingStatus", "Completed");
    unsold.put("org.SellingStatus.QuantitySold", 0);
    
    unanswered.put("org.ItemID", new BasicDBObject("$exists", 1));
    unanswered.put("membermessages.MessageStatus", "Unanswered");
    //unanswered.put("org.ListingDetails.HasUnansweredQuestions", "true");
    
    saved.put("org.ItemID", new BasicDBObject("$exists", 0));
    //saved.put("setting.schedule", new BasicDBObject("$exists", 0));
    
    LinkedHashMap<String,BasicDBObject> selling = new LinkedHashMap<String,BasicDBObject>();
    selling.put("allitems",  allitems);
    selling.put("scheduled", scheduled);
    selling.put("active",    active);
    selling.put("sold",      sold);
    selling.put("unsold",    unsold);
    selling.put("unanswered", unanswered);
    selling.put("saved",     saved);
        
    return selling;
  }
  
  private LinkedHashMap<Integer,String> categorypath2(String site, Integer categoryid) {
    
    LinkedHashMap<Integer,String> path = new LinkedHashMap<Integer,String>();
    LinkedHashMap<Integer,String> pathtmp = new LinkedHashMap<Integer,String>();
    ArrayList<Integer> cidtmp = new ArrayList<Integer>();
    
    BasicDBObject query = new BasicDBObject();
    DBCollection coll = db.getCollection(site+".Categories");
    
    while (true) {
      query.put("CategoryID", categoryid.toString());
      BasicDBObject row = (BasicDBObject) coll.findOne(query);
      
      path.put(Integer.parseInt(row.getString("CategoryID")), row.getString("CategoryName"));
      cidtmp.add(0, Integer.parseInt(row.getString("CategoryID")));
      
      if (row.getString("CategoryLevel").equals("1")) break;
      categoryid = Integer.parseInt(row.getString("CategoryParentID"));
    }
    
    for (Integer cid : cidtmp) {
      pathtmp.put(cid, path.get(cid));
    }
    
    return pathtmp;
  }
  
  private ArrayList categorypath(String site, Integer categoryid) {
    
    ArrayList path = new ArrayList();
    BasicDBObject query = new BasicDBObject();
    DBCollection coll = db.getCollection(site+".Categories");
    
    while (true) {
      query.put("CategoryID", categoryid.toString());
      BasicDBObject row = (BasicDBObject) coll.findOne(query);
      path.add(0, Integer.parseInt(row.getString("CategoryID")));
      
      if (row.getString("CategoryLevel").equals("1")) break;
      categoryid = Integer.parseInt(row.getString("CategoryParentID"));
    }
    
    return path;
  }
  
  @Action(value="/json/site")
  public String site() {
    
    /* handling post parameters */
    String site = ((String[]) parameters.get("site"))[0];
    
    /* grandchildren */
    String[] pathstr = {"0"};
    BasicDBObject children2 = children2(site, pathstr);
    
    BasicDBObject ebaydetails =
      (BasicDBObject) db.getCollection(site+".eBayDetails").findOne();
    
    BasicDBObject categoryfeatures =
      (BasicDBObject) db.getCollection(site+".CategoryFeatures").findOne();
    
    json.put("Categories",       children2.get("Categories"));
    json.put("eBayDetails",      ebaydetails);
    json.put("CategoryFeatures", categoryfeatures);
    json.put("ThemeGroup",       themegroup(site));
    
    return SUCCESS;
  }

  @Action(value="/json/descriptiontemplate")
  public String descriptiontemplate() {
    
    String site    = ((String[]) parameters.get("site"))[0];
    String groupid = ((String[]) parameters.get("groupid"))[0];
    
    json = _descriptiontemplate(site, groupid);
    
    return SUCCESS;
  }  

  private LinkedHashMap<String,Object> _descriptiontemplate(String site, String groupid) {
    
    LinkedHashMap<String,Object> lhm = new LinkedHashMap<String,Object>();
    
    BasicDBObject query = new BasicDBObject();
    query.put("GroupID", groupid);
    
    DBCollection coll = db.getCollection(site+".DescriptionTemplates.DescriptionTemplate");
    DBCursor cur = coll.find(query);
    while (cur.hasNext()) {
      BasicDBObject row = (BasicDBObject) cur.next();
      String id = row.get("_id").toString();
      lhm.put(id, row);
    }    
    
    return lhm;
  }
  
  @Action(value="/json/gc2")
  public String gc2() {
    
    /* handling post parameters */
    String site = ((String[]) parameters.get("site"))[0];
    String path = ((String[]) parameters.get("path"))[0];
    String[] arrpath = path.split("\\.");
    
    json.put("gc2", children2(site, arrpath));
    
    return SUCCESS;
  }
  
  @Action(value="/json/refresh")
  public String refresh() throws Exception {
    
    json = _items();
    
    json.put("summary", summarydata());
    
    return SUCCESS;
  }
  
  @Action(value="/json/dismissmessage")
  public String dismissmessage() throws Exception {
    
    updatemessage(user.getString("email"), false, "");
    
    return SUCCESS;
  }
  
  @Action(value="/json/sendmessage")
  public String sendmessage() throws Exception {
    
    /*
        for (String key : parameters.keySet()) {
            String[] vals = parameters.get(key);
        }
    
    String[] args = {
      "AddMemberMessageAAQToPartner",
      session.get("email").toString,
      ((String[]) parameters.get("userid"))[0],
      ((String[]) parameters.get("itemid"))[0],
      ((String[]) parameters.get("buyer"))[0],
      ((String[]) parameters.get("body"))[0]
    };
    
    String result = writesocket(args);
        */
    
        return SUCCESS;
  }
  
  @Action(value="/json/orders")
  public String orders() throws Exception {
    
    LinkedHashMap<String,Object> orderjson = new LinkedHashMap<String,Object>();
    
    ArrayList<BasicDBObject> orders = new ArrayList<BasicDBObject>();
    
    int limit = 100;
    int offset = 0;
    if (parameters.containsKey("limit"))
      limit = Integer.parseInt(((String[]) parameters.get("limit"))[0]);
    if (parameters.containsKey("offset"))
      offset = Integer.parseInt(((String[]) parameters.get("offset"))[0]);
    
    DBCollection coll = db.getCollection("orders."+user.getString("_id"));
    
    BasicDBObject query = new BasicDBObject();
    
    BasicDBObject field = new BasicDBObject();
    
    BasicDBObject sort = new BasicDBObject();
    sort.put("org.CreatedTime", -1);
    
    /* each orders */
    DBCursor cur = coll.find(query, field).limit(limit).skip(offset).sort(sort);
    orderjson.put("cnt", cur.count());
    while (cur.hasNext()) {
      
      DBObject order = cur.next();
      
      
      orders.add((BasicDBObject) order);
    }    
    
    json.put("orders", orders);
    
    return SUCCESS;
  }
  
  @Action(value="/json/addmembermessagertq")
  public String addmembermessagertq() throws Exception {
      
    String email  = session.get("email").toString();
    String userid = ((String[]) parameters.get("userid"))[0];
    String itemid = ((String[]) parameters.get("itemid"))[0];
    String parent = ((String[]) parameters.get("parent"))[0];
    String body   = ((String[]) parameters.get("body"))[0].replace("\n", "\\n");
    
    /* AddMemberMessageRTQ */
    String[] args = {"AddMemberMessageRTQ", email, userid, itemid, parent, body};
    String result = writesocket(args);
    
    /* GetMemberMessage */
    if (result.equals("Success")) {
      args = new String[]{"GetMemberMessages", email, userid, itemid};
      result = writesocket(args);
    }
    
    updatemessage(user.getString("email"), false, "Sent message.");
    
    json.put("result", result);

    return SUCCESS;
  }    
  
  private BasicDBObject children3(String site, BasicDBObject paths, BasicDBObject features) {
    
    BasicDBObject categories = new BasicDBObject();
    
    DBCollection coll    = db.getCollection(site+".Categories");
    DBCollection collft  = db.getCollection(site+".CategoryFeatures");
    DBCollection collftc = db.getCollection(site+".CategoryFeatures.Category");
    
    BasicDBObject field = new BasicDBObject();
    field.put("CategoryID",   1);
    field.put("CategoryName", 1);
    
    for (Object opath : paths.keySet()) {
      
      String categoryid = opath.toString();
      //log.debug("ren3:" + categoryid);
      
      BasicDBObject dbo = (BasicDBObject) paths.get(categoryid);
      
      /* Find child categories */
      BasicDBObject query = new BasicDBObject();
      if (categoryid.equals("0")) {
        
        query.put("CategoryLevel", "1");
        
        DBObject dboft = collft.findOne(null, new BasicDBObject("SiteDefaults", true));
        features = (BasicDBObject) dboft.get("SiteDefaults");
        
      } else {
        
        query.put("CategoryParentID", categoryid);
        
        /* CategoryFeatures */
        BasicDBObject dboft = 
          (BasicDBObject) collftc.findOne(new BasicDBObject("CategoryID", categoryid));
        if (dboft != null) {
          for (Object o : dboft.keySet()) {
            features.put(o.toString(), dboft.get(o.toString()));
          }
        }
      }
      
      DBCursor cursor = coll.find(query, field).sort(new BasicDBObject("_id", 1));
      //log.debug(" children:" + cursor.count());
      if (cursor.count() == 0) continue;
      
      BasicDBObject tmpchildren = new BasicDBObject();
      while (cursor.hasNext()) {
        BasicDBObject row = (BasicDBObject) cursor.next();
        
        if (row.getString("CategoryID").equals(categoryid)) continue;
        
        BasicDBObject childinfo = new BasicDBObject();
        
        childinfo.put("name", row.getString("CategoryName"));
        
        DBCursor cursor2 = coll.find(new BasicDBObject("CategoryParentID",
                                                       row.getString("CategoryID")));
        
        childinfo.put("children", cursor2.count());
        
        for (Object chkks : ((BasicDBObject) paths.get(categoryid)).keySet()) {
          if (row.getString("CategoryID").equals(chkks.toString())) {
            
            childinfo.put("CategoryFeatures", features);
            
            /* CategorySpecifics */
            DBCollection collspc = db.getCollection(site+".CategorySpecifics");
            DBObject dbospc = collspc.findOne
              (new BasicDBObject("CategoryID", row.getString("CategoryID")));
            if (dbospc != null) {
              dbospc.removeField("_id");
              childinfo.put("CategorySpecifics", dbospc);
            }
            
            categories.put("c"+row.getString("CategoryID"), childinfo);
          }
        }

        tmpchildren.put("c"+row.getString("CategoryID"), childinfo);
      }
      
      categories.put("c" + categoryid, tmpchildren);
      
      /* next in paths */
      BasicDBObject tmpchildo = (BasicDBObject) paths.get(categoryid);
      if (tmpchildo.isEmpty()) {
        
        /* leaf of selected category*/
        
      } else {
        
        /* not leaf */
        BasicDBObject tmpc3 = children3(site, tmpchildo, features);
        for (Object tmpc3o : tmpc3.keySet()) {
          String tmpcid = tmpc3o.toString();
          categories.put(tmpcid, tmpc3.get(tmpcid));
        }
        
      }
    }
    
    return categories;
  }
  
  private BasicDBObject children2(String site, String[] path) {
    
    BasicDBObject result = new BasicDBObject();
    BasicDBObject categories = new BasicDBObject();
    
    DBCollection coll    = db.getCollection(site+".Categories");
    DBCollection collft  = db.getCollection(site+".CategoryFeatures");
    DBCollection collftc = db.getCollection(site+".CategoryFeatures.Category");
    DBCollection collspc = db.getCollection(site+".CategorySpecifics");
    
    DBObject dbo = collft.findOne(null, new BasicDBObject("SiteDefaults", true));
    BasicDBObject features = (BasicDBObject) dbo.get("SiteDefaults");
    
    BasicDBObject field = new BasicDBObject();
    field.put("CategoryID",   1);
    field.put("CategoryName", 1);
    
    for (String categoryid : path) {
      
      /* CategoryFeatures */
      BasicDBObject dboft = 
        (BasicDBObject) collftc.findOne(new BasicDBObject("CategoryID", categoryid));
      if (dboft != null) {
        for (Object o : dboft.keySet()) {
          features.put(o.toString(), dboft.get(o.toString()));
        }
      }
      
      BasicDBObject query = new BasicDBObject();
      if (categoryid.equals("0")) {
        query.put("CategoryLevel", "1");
      } else {
        query.put("CategoryParentID", categoryid);
      }
      
      DBCursor cursor = coll.find(query, field).sort(new BasicDBObject("_id", 1));
      if (cursor.count() == 0) {
        continue;
      }
      
      BasicDBObject tmpchildren = new BasicDBObject();
      while (cursor.hasNext()) {
        BasicDBObject row = (BasicDBObject) cursor.next();
        
        if (row.getString("CategoryID").equals(categoryid)) continue;
        
        BasicDBObject childinfo = new BasicDBObject();
        
        childinfo.put("name", row.getString("CategoryName"));
        
        DBCursor cursor2 = coll.find(new BasicDBObject("CategoryParentID",
                                                       row.getString("CategoryID")));
        
        childinfo.put("children", cursor2.count());
        
        if (row.getString("CategoryID").equals(path[path.length-1])) {
          childinfo.put("CategoryFeatures", features);
          
          /* CategorySpecifics */
          DBObject dbospc = collspc.findOne
            (new BasicDBObject("CategoryID", row.getString("CategoryID")));
          if (dbospc != null) {
            dbospc.removeField("_id");
            childinfo.put("CategorySpecifics", dbospc);
          }
        }
        
        tmpchildren.put("c"+row.getString("CategoryID"), childinfo);
      }
      categories.put("c"+categoryid, tmpchildren);
    }
    
    result.put("Categories", categories);
    
    return result;
  }
  
  private BasicDBObject getsitedefaults(String site) {
    
    DBCollection collection = db.getCollection(site+".CategoryFeatures");
    DBObject dbo = collection.findOne(null, new BasicDBObject("SiteDefaults", true));
    BasicDBObject sitedefaults = (BasicDBObject) dbo.get("SiteDefaults");
    
    return sitedefaults;
  }
  
  // todo: check UK:courier?
  public LinkedHashMap<String,LinkedHashMap> shippingtype(String site) {
    
    LinkedHashMap<String,LinkedHashMap>    map = new LinkedHashMap<String,LinkedHashMap>();
    LinkedHashMap<String,String>      domestic = new LinkedHashMap<String,String>();
    LinkedHashMap<String,String> international = new LinkedHashMap<String,String>();
    
    if (site.equals("US")) {
      domestic.put("Flat"      , "Flat: same cost to all buyers");
      domestic.put("Calculated", "Calculated: Cost varies by buyer location");
      domestic.put("Freight"   , "Freight: large items over 150 lbs.");
    } else {
      domestic.put("Calculated", "Calculated: Cost varies by buyer location");
      domestic.put("Flat"      , "Flat: same cost to all buyers");
    }
    domestic.put("NoShipping", "No shipping: Local pickup only");
    
    international.put("Flat"      , "Flat: same cost to all buyers");
    international.put("Calculated", "Calculated: Cost varies by buyer location");
    international.put("NoShipping", "No international shipping");
    
    map.put("domestic"     , domestic);
    map.put("international", international);
    
    return map;
  }
  
  /*
  private String getShippingType(String dmst, String intl) {
    
    String[][] typemap = {
      {"Flat",       "Flat",       "Flat"},
      {"Flat",       "NoShipping", "Flat"},
      {"Calculated", "Calculated", "Calculated"},
      {"Flat",       "Calculated", "FlatDomesticCalculatedInternational"},
      {"Calculated", "Flat",       "CalculatedDomesticFlatInternational"},
      {"Freight",    "???",        "FreightFlat"}
    };
    
    String shippingtype = "";
    
    for (int i=0; i<typemap.length; i++) {
      if (typemap[i][0].equals(dmst) && typemap[i][1].equals(intl)) {
        shippingtype = typemap[i][2];
        break;
      }
    }
    
    return shippingtype;
  }
  */
  
  // todo: reverse function?
  // todo: replace with getShippingType()
  private LinkedHashMap<String,LinkedHashMap> shippingmap() {
    
    LinkedHashMap<String,LinkedHashMap> map = new LinkedHashMap<String,LinkedHashMap>();
    LinkedHashMap<String,String>    tmpmap1 = new LinkedHashMap<String,String>();
    LinkedHashMap<String,String>    tmpmap2 = new LinkedHashMap<String,String>();
    LinkedHashMap<String,String>    tmpmap3 = new LinkedHashMap<String,String>();
    LinkedHashMap<String,String>    tmpmap4 = new LinkedHashMap<String,String>();
    LinkedHashMap<String,String>    tmpmap5 = new LinkedHashMap<String,String>();
    LinkedHashMap<String,String>    tmpmap6 = new LinkedHashMap<String,String>();
    
    tmpmap1.put("domestic",      "Flat");
    tmpmap1.put("international", "Flat");
    map.put("Flat"                               , tmpmap1);
    
    tmpmap2.put("domestic",      "Calculated");
    tmpmap2.put("international", "Calculated");
    map.put("Calculated"                         , tmpmap2);
    
    tmpmap3.put("domestic",      "Flat");
    tmpmap3.put("international", "Calculated");
    map.put("FlatDomesticCalculatedInternational", tmpmap3);
    
    tmpmap4.put("domestic",      "Calculated");
    tmpmap4.put("international", "Flat");
    map.put("CalculatedDomesticFlatInternational", tmpmap4);
    
    // todo: check "Freight" is only web?
    tmpmap5.put("domestic",      "Freight");
    tmpmap5.put("international", "???");
    map.put("FreightFlat"                        , tmpmap5);
    
    tmpmap6.put("domestic",      "Flat");
    tmpmap6.put("international", "NoShipping");
    map.put("Flat"                               , tmpmap6);
    
    return map;
  }
  
  private LinkedHashMap<String,String> getebaydetails(String coll, String key, String value) {
    LinkedHashMap<String,String> hash = new LinkedHashMap<String,String>();
    
    BasicDBObject query = new BasicDBObject();
    BasicDBObject field = new BasicDBObject();
    field.put(key, 1);
    field.put(value, 1);
    
    DBCursor cursor = db.getCollection(coll).find(query, field);
    while (cursor.hasNext()) {
      BasicDBObject row  = (BasicDBObject) cursor.next();
      hash.put(row.getString(key), row.getString(value));
    }
    
    return hash;
  }
  
  private LinkedHashMap<String,String> countrydetails(String site) {
    
    LinkedHashMap<String,String> hash = new LinkedHashMap<String,String>();
    
    BasicDBObject query = new BasicDBObject();
    
    BasicDBObject field = new BasicDBObject();
    field.put("Country", 1);
    field.put("Description", 1);
    
    DBCollection collection = db.getCollection(site+".eBayDetails.CountryDetails");
    DBCursor cursor = collection.find(query, field);
    while (cursor.hasNext()) {
      BasicDBObject row  = (BasicDBObject) cursor.next();
      
      hash.put(row.getString("Country"),
           row.getString("Description"));
    }
    
    return hash;
  }
  
  private LinkedHashMap<String,String> currencydetails(String site) {
    
    LinkedHashMap<String,String> hash = new LinkedHashMap<String,String>();
    
    BasicDBObject query = new BasicDBObject();
    
    BasicDBObject field = new BasicDBObject();
    field.put("Currency", 1);
    field.put("Description", 1);
    
    DBCollection collection = db.getCollection(site+".eBayDetails.CurrencyDetails");
    DBCursor cursor = collection.find(query, field);
    while (cursor.hasNext()) {
      BasicDBObject row  = (BasicDBObject) cursor.next();
      
      hash.put(row.getString("Currency"),
           row.getString("Description"));
    }
    
    return hash;
  }
  
  private LinkedHashMap<String,String> shippingtypelabel2(BasicDBObject item) {
    LinkedHashMap<String,String> label = new LinkedHashMap<String,String>();
    
    BasicDBObject mod = (BasicDBObject) item.get("mod");
    BasicDBObject sd = (BasicDBObject) mod.get("ShippingDetails");
    if (sd.containsField("ShippingType")) {
      String shippingtype = sd.getString("ShippingType");
      if (shippingtype.equals("Flat")) {
        label.put("domestic",      "Flat");
        label.put("international", "Flat");
      } else if (shippingtype.equals("Calculated")) {
        label.put("domestic",      "Calculated");
        label.put("international", "Calculated");
      } else if (shippingtype.equals("FlatDomesticCalculatedInternational")) {
        label.put("domestic",      "Flat");
        label.put("international", "Calculated");
      } else if (shippingtype.equals("CalculatedDomesticFlatInternational")) {
        label.put("domestic",      "Calculated");
        label.put("international", "Flat");
      } else if (shippingtype.equals("FreightFlat")) {
        label.put("domestic",      "Freight");
        label.put("international", "");
      }
      if (!sd.containsField("InternationalShippingServiceOption")) {
        label.put("international", "");
      }
    } else {
      label.put("domestic",      "");
      label.put("international", "");
    }
    
    return label;
  }
  
  // todo: replace with shippingtypelabel2() method.
  private LinkedHashMap<String,String> shippingtypelabel(String site, String type) {
    
    LinkedHashMap<String,String> label = new LinkedHashMap<String,String>();
    
    LinkedHashMap<String,LinkedHashMap> types = shippingtype(site);
    LinkedHashMap<String,LinkedHashMap> map   = shippingmap();
    
    label.put("domestic",
          (String) types.get("domestic").get(map.get(type).get("domestic")));
    
    label.put("international",
          (String) types.get("international").get(map.get(type).get("international")));
    
    return label;
  }
  
  private LinkedHashMap<String,String> dispatchtimemaxdetails(String site) {
    
    LinkedHashMap<String,String> map = new LinkedHashMap<String,String>();
    
    DBCollection collection = db.getCollection(site+".eBayDetails.DispatchTimeMaxDetails");
    DBCursor cursor = collection.find();
    while (cursor.hasNext()) {
      BasicDBObject row = (BasicDBObject) cursor.next();
      
      String k = row.getString("DispatchTimeMax");
      String v = row.getString("Description");
      
      map.put(k, v);
    }
    
    return map;
  }
  
  private LinkedHashMap<String,LinkedHashMap> shippingservicedetails(String site) {
    
    LinkedHashMap<String,LinkedHashMap> map = new LinkedHashMap<String,LinkedHashMap>();
    
    DBCollection collection = db.getCollection(site+".eBayDetails.ShippingServiceDetails");
    DBCursor cursor = collection.find(new BasicDBObject("ValidForSellingFlow", "true"));
    while (cursor.hasNext()) {
      DBObject row = cursor.next();
      
      String ss = row.get("ShippingService").toString();
      
      row.removeField("_id");
      row.removeField("UpdateTime");
      
      map.put(ss, (LinkedHashMap) row.toMap());
    }
    
    return map;
  }
  
  private LinkedHashMap<String,LinkedHashMap> shippingpackagedetails(String site) {
    
    LinkedHashMap<String,LinkedHashMap> map = new LinkedHashMap<String,LinkedHashMap>();
    
    DBCollection collection = db.getCollection(site+".eBayDetails.ShippingPackageDetails");
    DBCursor cursor = collection.find();
    while (cursor.hasNext()) {
      DBObject row = cursor.next();
      
      String id = row.get("ShippingPackage").toString();
      
      row.removeField("_id");
      row.removeField("UpdateTime");
      
      map.put(id, (LinkedHashMap) row.toMap());
    }
    
    return map;
  }

  private Integer mapcategoryid(String site, Integer categoryid) {
    
    DBObject newdbo = db.getCollection(site+".CategoryMappings")
      .findOne(new BasicDBObject("@oldID", categoryid.toString()));
    if (newdbo != null) {
      categoryid = Integer.parseInt(newdbo.get("@id").toString());
    }
    
    return categoryid;
  }
  
  private BasicDBObject getFilterQuery() {
    
    /* allways filter with userids */
    ArrayList<String> userids = new ArrayList<String>();
    for (Object useridobj : (BasicDBList) user.get("userids2")) {
      userids.add(((BasicDBObject) useridobj).getString("username"));
    }
    
    BasicDBObject query = new BasicDBObject();
    
    if (parameters.containsKey("id")) {
      
      ArrayList<ObjectId> ids = new ArrayList<ObjectId>();
      for (String id : (String[]) parameters.get("id")) {
        ids.add(new ObjectId(id));
      }
      query.put("_id", new BasicDBObject("$in", ids));
      query.put("UserID", new BasicDBObject("$in", userids));
      
    } else {
      
      String selling = "";
      String userid  = "";
      String title   = "";
      String listingtype = "";
      String itemid  = "";
      
      LinkedHashMap<String,BasicDBObject> sellingquery = getsellingquery();
      
      if (parameters.containsKey("selling"))
        selling = ((String[]) parameters.get("selling"))[0];
      
      if (!selling.equals(""))
        query = sellingquery.get(selling);
      
      // notice: put UserID here, because sellingquery above.
      query.put("UserID", new BasicDBObject("$in", userids));
      
      // todo: check the UserID exists in users collection.
      if (parameters.containsKey("UserID"))
        userid = ((String[]) parameters.get("UserID"))[0];
      
      if (!userid.equals(""))
        query.put("UserID", userid);
      
      if (parameters.containsKey("Title"))
        title = ((String[]) parameters.get("Title"))[0];
      
      if (!title.equals(""))
        query.put("mod.Title", Pattern.compile(title));
      
      if (parameters.containsKey("mod.ListingType"))
        listingtype = ((String[]) parameters.get("mod.ListingType"))[0];
      
      if (!listingtype.equals(""))
        query.put("mod.ListingType", listingtype);
      
      if (parameters.containsKey("ItemID")) 
        itemid = ((String[]) parameters.get("ItemID"))[0];
      
      if (!itemid.equals(""))
        query.put("org.ItemID", itemid);
      
    }
    
    return query;
  }
  
  /**
   * Copied from GetItem.java
   */
  private void convertfield(DBObject dbo, String field) throws Exception {
    
    String[] path = field.split("\\.", 2);
    
    if (!dbo.containsField(path[0])) return;
    
    String classname = dbo.get(path[0]).getClass().toString();
    
    /* leaf */
    if (path.length == 1) {
      Double doubleval = new Double(dbo.get(path[0]).toString());
      dbo.put(path[0], doubleval);
      return;
    }
    
    /* not leaf */
    if (classname.equals("class com.mongodb.BasicDBList")) {
      BasicDBList orgdbl = (BasicDBList) dbo.get(path[0]);
      for (int i = 0; i < orgdbl.size(); i++) {
        convertfield((DBObject) orgdbl.get(i), path[1]);
      }
    } else if (classname.equals("class com.mongodb.BasicDBObject")) {
      convertfield((DBObject) dbo.get(path[0]), path[1]);
    }
    
    return;
  }
  
  private void convertint(DBObject dbo, String field) throws Exception {
    
    String[] path = field.split("\\.", 2);
    
    if (!dbo.containsField(path[0])) return;
    
    String classname = dbo.get(path[0]).getClass().toString();
    
    /* leaf */
    if (path.length == 1) {
      Integer intval = new Integer(dbo.get(path[0]).toString());
      dbo.put(path[0], intval);
      return;
    }
    
    /* not leaf */
    if (classname.equals("class com.mongodb.BasicDBList")) {
      BasicDBList orgdbl = (BasicDBList) dbo.get(path[0]);
      for (int i = 0; i < orgdbl.size(); i++) {
        convertint((DBObject) orgdbl.get(i), path[1]);
      }
    } else if (classname.equals("class com.mongodb.BasicDBObject")) {
      convertint((DBObject) dbo.get(path[0]), path[1]);
    }
    
    return;
  }
  
  private void convertdate(DBObject dbo, String field) throws Exception {
    
    String[] path = field.split("\\.", 2);
    
    if (!dbo.containsField(path[0])) return;
    
    String classname = dbo.get(path[0]).getClass().toString();
    
    /* leaf */
    if (path.length == 1) {
      
      String value = dbo.get(path[0]).toString();
      value = value.replace("T", " ").replace(".000Z", "");
      
      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
      sdf.setLenient(false);
      sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
      Date date = sdf.parse(value);
      
      dbo.put(path[0], date);
      
      return;
    }
    
    /* not leaf */
    if (classname.equals("class com.mongodb.BasicDBList")) {
      BasicDBList orgdbl = (BasicDBList) dbo.get(path[0]);
      for (int i = 0; i < orgdbl.size(); i++) {
        convertdate((DBObject) orgdbl.get(i), path[1]);
      }
    } else if (classname.equals("class com.mongodb.BasicDBObject")) {
      convertdate((DBObject) dbo.get(path[0]), path[1]);
    }
    
    return;
  }
  
}
