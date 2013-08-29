package ebaytool.actions;

import com.sun.syndication.io.XmlReader;
import com.mongodb.*;
import ebaytool.actions.BaseAction;
import java.io.*;
import java.net.URL;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import javax.net.ssl.HttpsURLConnection;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;
import net.sf.json.xml.XMLSerializer;
import org.apache.struts2.convention.annotation.Action;
import org.apache.struts2.convention.annotation.ParentPackage;
import org.apache.struts2.convention.annotation.Result;
import org.apache.struts2.convention.annotation.Results;

@ParentPackage("json-default")
public class PageAction extends BaseAction {
  
  protected LinkedHashMap<String, Object> initjson;
  protected BasicDBObject blogfeed;
  
  public PageAction() throws Exception {
  }
  
  public BasicDBObject getUser() {
    return user;
  }
  
  public LinkedHashMap<String, Object> getInitjson() {
    return initjson;
  }
  
  public BasicDBObject getBlogfeed() throws Exception {
    return blogfeed;
  }
  
  public BasicDBObject getGithubfeed() throws Exception {
    
    String xml = readfile(configdbo.getString("githubfile"));
    
    BasicDBObject feed = convertXML2DBObject(xml);
    
    return feed;
  }
  
  /* todo: session management in useraction json request */
  
  @Action(value="/page/index", results={@Result(name="alreadyloggedin",type="redirect",location="https://listers.in/"),
                                        @Result(name="loggedin",type="redirect",location="https://listers.in/")})
  public String execute() throws Exception {
    
    /*
    for (String s : session.keySet()) {
      log.debug(s + ":" + session.get(s).toString());
    }
    */
    
    String locale = request.getLocale().toString();
    if (session.containsKey("WW_TRANS_I18N_LOCALE")) {
      locale = session.get("WW_TRANS_I18N_LOCALE").toString();
    }
		
    DBCollection coll = db.getCollection("users");
    
    BasicDBObject query = new BasicDBObject();
    user  = new BasicDBObject();
    
    String email = "";
    String password = "";
    
    if (session.get("email") != null) {
      
      query.put("email", session.get("email").toString());
      user = (BasicDBObject) coll.findOne(query);
      initjson = new LinkedHashMap<String, Object>();
      
      if (user != null) {
        session.put("email", user.get("email").toString());
        
        BasicDBObject hash = new BasicDBObject();
        DBObject row = db.getCollection("US.eBayDetails")
          .findOne(null, new BasicDBObject("SiteDetails", 1));
        BasicDBList sitedetails = (BasicDBList) row.get("SiteDetails");
        for (Object sitedbo : sitedetails) {
          hash.put(((BasicDBObject) sitedbo).getString("Site"), null);
        }
        
        initjson.put("hash", hash.toString());

        /* TimeZone IDs */
        BasicDBObject timezoneids = new BasicDBObject();
        for (String tzid : TimeZone.getAvailableIDs()) {
          //if (tzid.length() <= 2) continue;
          //if (!tzid.substring(0, 3).equals("Etc")) continue;
          if (tzid.length() <= 3) continue;
                    
          TimeZone tz = TimeZone.getTimeZone(tzid);
          timezoneids.put(tzid, tz.getDisplayName());
        }
        TreeMap<String,String> sortedids = new TreeMap<String,String>();
        sortedids.putAll((HashMap) timezoneids);

        BasicDBObject timezoneids2 = new BasicDBObject();
        timezoneids2.putAll(sortedids);
        
        initjson.put("timezoneids", timezoneids2);
        
        /* Schedule Days */
        initjson.put("scheduledays", getScheduleDays());
				
				
				/* Default date range value for sync item form */
				SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
				Calendar cal = Calendar.getInstance();
				cal.add(Calendar.DATE, 60);
				String end   = formatter.format(cal.getTime());
				cal.add(Calendar.DATE, -119); // min -119 from endtime
				String start = formatter.format(cal.getTime());
				
				BasicDBObject mischash = new BasicDBObject();
				mischash.put("datestart", start);
				mischash.put("dateend", end);
				initjson.put("mischash", mischash);
				
        return "alreadyloggedin";
      }
    }
    
    if (parameters.get("email") != null && parameters.get("password") != null) {
      
      email    = ((String[]) parameters.get("email"))[0];
      password = ((String[]) parameters.get("password"))[0];
      
      // todo: encrypt password
      // todo: check expiration date and time.
      query.put("email",    email);
      query.put("password", password);
      query.put("status",   "free trial");
      
      user = (BasicDBObject) coll.findOne(query);
      
      if (user != null) {
        session.put("email", user.get("email").toString());
        log.debug("loggedin: "+user.get("email").toString());
        return "loggedin";
      }
    }
    
    /* Read Blog RSS */
    String blogxml;
    if (locale.equals("ja") || locale.equals("ja_JP")) {
      blogxml = readfile(configdbo.getString("ameblofile"));
    } else {
      blogxml = readfile(configdbo.getString("blogfile"));
    }
    blogfeed = convertXML2DBObject(blogxml);
    
    return SUCCESS;
  }
  
  @Action(value="/page/nodelogin", results={@Result(name="success",location="nodelogin.jsp"),
                                            @Result(name="failed",type="redirect",location="/page/index")})
  public String nodelogin() {
    if (session.get("email") != null) {
      return SUCCESS;
    } else {
      return "failed";
    }
  }
  
  @Action(value="/page/signup_confirm", results={@Result(name="success",location="signup.jsp"),
                                               @Result(name="signup_complete",type="redirect",location="/page/index")})
  public String signup_confirm() {
    
    // todo: also check ip address.
    String tmptoken = ((String[]) parameters.get("t"))[0];
    
    BasicDBObject query = new BasicDBObject();
    query.put("status", "temporary registration");
    query.put("tmptoken", tmptoken);
    query.put("tmptoken_expiration", new BasicDBObject("$gt", basetimestamp));
    
    BasicDBObject tempuser = (BasicDBObject) db.getCollection("users").findOne(query);
    if (tempuser != null) {
      log.debug("temporary user found:"+tempuser.getString("email"));
      
      // 30 days expiration
      SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ssZ");
      sdf.setLenient(false);
      sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
      Calendar cal = Calendar.getInstance();
      cal.add(Calendar.DATE, 30);
      String expiration = sdf.format(cal.getTime());
      
      // change user status
      BasicDBObject set = new BasicDBObject();
      set.put("status", "free trial");
      set.put("expiration", expiration);
      
      db.getCollection("users").update(query, new BasicDBObject("$set", set));
      
      session.put("email", tempuser.getString("email"));
      
      return "signup_complete";
    }
    
    return SUCCESS;
  }

  @Action(value="/page/reset_password", results={@Result(name="success",location="resetpassword.jsp")})
  public String reset_password() {
    
    // todo: also check ip address.
    String tmptoken = ((String[]) parameters.get("t"))[0];
    
    BasicDBObject query = new BasicDBObject();
    query.put("status", "free trial");
    query.put("tmptoken", tmptoken);
    query.put("tmptoken_expiration", new BasicDBObject("$gt", basetimestamp));
    
    user = (BasicDBObject) db.getCollection("users").findOne(query);
    if (user == null) {
      
    }
    
    return SUCCESS;
  }
  
  @Action(value="/page/login", results={@Result(name="success",type="redirect",location="https://listers.in/")})
  public String login() {
		
    DBCollection coll = db.getCollection("users");
    
    BasicDBObject query = new BasicDBObject();
    
    String email    = ((String[]) parameters.get("email"))[0];
    String password = ((String[]) parameters.get("password"))[0];
      
    query.put("email",    email);
    query.put("password", password);
    
    user = (BasicDBObject) coll.findOne(query);
    
    if (user != null) {
      session.put("email", user.get("email").toString());
    }
    
    return SUCCESS;
  }
  
  @Action(value="/page/logout", results={@Result(name="success",type="redirect",location="https://listers.in/")})
  public String logout() {
		
    if (session.get("email") != null) {
      db.getCollection("users")
        .update(new BasicDBObject("email", session.get("email").toString()),
                new BasicDBObject("$unset", new BasicDBObject("JSESSIONID", "")));
		}
    
    session.remove("email");
    
    return SUCCESS;
  }

  @Action(value="/page/cancelaccount", results={@Result(name="success",location="index.jsp")})
  public String cancelaccount() {
    
    // drop items.[userid] collection
    db.getCollection("items."+user.getString("_id")).drop();
    
    // todo: move instead delete
    BasicDBObject query = new BasicDBObject();
    db.getCollection("users").remove(new BasicDBObject("email", user.getString("email")));
    
    session.remove("email");
    
    return SUCCESS;
  }
  
  // todo: forgot password
  // todo: change password
  
  @Action(value="/page/accept", results={@Result(name="success",type="redirect",location="/page/index")})
  public String accept() throws Exception {
    
    String username  = ((String[]) parameters.get("username"))[0];
    String email     = user.get("email").toString();
    String sessionid = user.get("sessionid").toString();
    
    /* FetchToken */
    String[] args = {"FetchToken", email, sessionid, username};
    String result = writesocket(args); // wait
        
    /* SetNotificationPreferences */
    args = new String[]{"SetNotificationPreferences", email, username};
    writesocket_async(args); // not wait
    
    SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
    Calendar cal = Calendar.getInstance();
    cal.add(Calendar.DATE, 60);
    String end   = formatter.format(cal.getTime());
    cal.add(Calendar.DATE, -119); // min -119 from endtime
    String start = formatter.format(cal.getTime());
    
    updatemessage(email, true,
                  "Importing " + username + "'s items from eBay"
                  + " which end between " + start + " and " + end + ".");
    
    /* GetSellerList */
    args = new String[]{"GetSellerList", email, username, "End", start, end, "ReturnAll"};
    writesocket_async(args); // not wait
    
    if (false) {
      cal = Calendar.getInstance();
      cal.add(Calendar.DATE, 0);
      end   = formatter.format(cal.getTime());
      cal.add(Calendar.DATE, -60); // what is max?
      start = formatter.format(cal.getTime());
      
      /* GetMemberMessages */
      args = new String[]{"GetMemberMessages", email, username,
                          start + "T00:00:00.000Z",
                          end + "T00:00:00.000Z"};
      writesocket_async(args);
      // not wait
    }
    
    return SUCCESS;
  }
  
  @Action(value="/page/receivenotify", results={@Result(name="success",location="receivenotify.jsp")})
  public String receivenotify() throws Exception {
    
    // read XML
    String notifyxml = "";
    String line = "";
    BufferedReader br = request.getReader();
    while ((line = br.readLine()) != null) {
      
      if (line.indexOf("<soapenv:") >= 0
          || line.indexOf("</soapenv:") >= 0
          || line.indexOf("<ebl:") >= 0
          || line.indexOf("</ebl:") >= 0) {
        continue;
      }
      
      notifyxml += line + "\n";
    }
    
    // convert XML to JSON
    XMLSerializer xmlSerializer = new XMLSerializer(); 
    xmlSerializer.setTypeHintsEnabled(false);
    net.sf.json.JSON notifyjson = xmlSerializer.read(notifyxml);
    BasicDBObject dbobject = (BasicDBObject) com.mongodb.util.JSON.parse(notifyjson.toString());
    
    String timestamp = dbobject.getString("Timestamp").replaceAll("\\.", "_");
    
    String eventname = dbobject.getString("NotificationEventName");
    String userid = dbobject.getString("RecipientUserID");
    
    /* make log directory for each call */
    String savedir = basedir + "/logs/apicall/notification";
    savedir += "/" + eventname + "/" + basetimestamp.substring(0, 10);
    if (!(new File(savedir)).exists()) {
      new File(savedir).mkdir();
    }
    
    // save xml file
    FileWriter fstream = new FileWriter(savedir + "/" + userid + "." + basetimestamp + ".xml");
    BufferedWriter out = new BufferedWriter(fstream);
    out.write(notifyxml);
    out.close();
    
    BasicDBObject userdbo = (BasicDBObject) db.getCollection("users").findOne
      (new BasicDBObject("userids2.username", userid));
    
    String email = userdbo.getString("email");
    String itemcollname = "items." + userdbo.getString("_id");
    
    String itemid = "";
    
    if (eventname.equals("AskSellerQuestion")) {
      
      BasicDBObject mm       = (BasicDBObject) dbobject.get("MemberMessage");
      BasicDBObject mme      = (BasicDBObject) mm.get("MemberMessageExchange");
      BasicDBObject item     = (BasicDBObject) mme.get("Item");
			BasicDBObject question = (BasicDBObject) mme.get("Question");
      
			String messageid = question.getString("MessageID");
      
      itemid = item.getString("ItemID");
      
      mme.removeField("Item");
      
      DBCollection itemcoll = db.getCollection("items."+userdbo.getString("_id"));
      
      BasicDBObject query = new BasicDBObject();
      query.put("org.ItemID", itemid);
      
      DBObject exitem = itemcoll.findOne(query);
      if (exitem == null) {
        String[] args = {"GetItem", userdbo.getString("email"), userid, itemid, "waitcallback"};
        String result = writesocket(args);
      }
      
      /* Remove existing message */
      BasicDBObject update = new BasicDBObject();
      update.put("$pull", new BasicDBObject("membermessages",
                                            new BasicDBObject("Question.MessageID", messageid)));
			itemcoll.update(query, update);
      
      /* Insert new message */
      update = new BasicDBObject();
      update.put("$push", new BasicDBObject("membermessages", mme));
			itemcoll.update(query, update);
      
    } else if (eventname.indexOf("Item") == 0) {
      
      BasicDBObject item = (BasicDBObject) dbobject.get("Item");
      itemid = item.getString("ItemID");
      
      upsertitem(email, userid, itemid, item, itemcollname, timestamp);
    }
    
    // todo: are ItemUnsold and ItemClosed same?
    if (eventname.equals("ItemUnsold")) {
      
      DBCollection itemcoll = db.getCollection("items."+userdbo.getString("_id"));
      
      BasicDBObject query = new BasicDBObject();
      query.put("UserID", userid);
      query.put("org.ItemID", itemid);
      
      BasicDBObject item = (BasicDBObject) itemcoll.findOne(query);
      
      if (item.containsField("setting")) {
        
        BasicDBObject setting = (BasicDBObject) item.get("setting");
        BasicDBObject autorelist = (BasicDBObject) setting.get("autorelist");
        
        log.debug("ItemUnsold autorelist["+autorelist.getString("enabled")+"]");
        log.debug("ItemUnsold addbestoffer["+autorelist.getString("addbestoffer")+"]");
        if (autorelist.getString("enabled").equals("on")) {
          
          // Add best offer
          if (autorelist.getString("addbestoffer").equals("true")) {
            BasicDBObject set = new BasicDBObject();
            set.put("mod.BestOfferDetails.BestOfferEnabled", "true");
            
            BasicDBObject update = new BasicDBObject();
            update.put("$set", set);
            
            itemcoll.update(query, update, false, false, WriteConcern.SAFE);
            
            item = (BasicDBObject) itemcoll.findOne(query);
          }
          
          // todo: append log "relisting..."
          // todo: taskid => status ? status = relist, taskid = 9999999 ?
          String taskid = "autorelist_"+basetimestamp+"_"+itemid;
          
          BasicDBObject update = new BasicDBObject();
          update.put("$set", new BasicDBObject("status", taskid));
          
          WriteResult writeresult = itemcoll.update(query, update, false, true);
          
          String[] args = {"RelistItem", userdbo.getString("email"), taskid};
          String result = writesocket(args);
                    
        }
      }
    }
    
    return SUCCESS;
  }
  
  @Action(value="/page/listeditems", results={@Result(name="success",location="listeditems.jsp")})
  public String listeditems() throws Exception {
    
    BasicDBList rows = new BasicDBList();
    
		DBCursor cursor = db.getCollection("listeditems").find();
		while (cursor.hasNext()) {
			BasicDBObject row = (BasicDBObject) cursor.next();
      rows.add(row);
		}		
    
    blogfeed = new BasicDBObject();
    blogfeed.put("rows", rows);
    
    return SUCCESS;
  }
  
  private BasicDBObject getScheduleDays() {
    
    BasicDBObject days = new BasicDBObject();
    
    SimpleDateFormat sdf1 = new SimpleDateFormat("yyyy-MM-dd");
    SimpleDateFormat sdf2 = new SimpleDateFormat("EEEE, MMM dd");
    sdf1.setTimeZone(TimeZone.getTimeZone("UTC"));
    sdf2.setTimeZone(TimeZone.getTimeZone("UTC"));
    
    Calendar cal = Calendar.getInstance();
    for (int i=0; i<=21; i++) {
      cal.add(Calendar.DATE, 1);
      String val = sdf1.format(cal.getTime());
      String str = sdf2.format(cal.getTime());
      
      days.put(val, str);
    }
    
    return days;
  }
  
  /**
   * todo: same method in GetItem.java
   */
  public void upsertitem(String email, String userid, String itemid,
                         BasicDBObject org,
                         String itemcollname,
                         String timestamp) throws Exception {
    
    BasicDBObject mod = (BasicDBObject) org.copy();
    
    /* delete ItemSpecifics added from Product */
    if (mod.containsField("ItemSpecifics")) {
      
      BasicDBObject itemspecifics = (BasicDBObject) mod.get("ItemSpecifics");
      BasicDBObject iscopy = (BasicDBObject) itemspecifics.copy();
      
      String classname = iscopy.get("NameValueList").getClass().toString();
      BasicDBList namevaluelist = new BasicDBList();
      if (classname.equals("class com.mongodb.BasicDBObject")) {
        namevaluelist.add((BasicDBObject) iscopy.get("NameValueList"));
      } else if (classname.equals("class com.mongodb.BasicDBList")) {
        namevaluelist = (BasicDBList) iscopy.get("NameValueList");
      } else {
        log.debug("Class Error:" + classname);
      }
      
      for (int i=namevaluelist.size()-1; i>=0; i--) {
        BasicDBObject namevalue = (BasicDBObject) namevaluelist.get(i);
        if (namevalue.containsField("Source")) {
          if (namevalue.getString("Source").equals("Product")) {
            ((BasicDBList) itemspecifics.get("NameValueList")).remove(i);
          }
        }
      }
    }
    
    /* delete fields which is not necessary in AddItem families */
    BasicDBList movefields = (BasicDBList) configdbo.get("removefield");
    for (Object fieldname : movefields) {
      movefield(mod, fieldname.toString());
    }
    
		BasicDBList doublefields = (BasicDBList) configdbo.get("doublefield");
		for (Object fieldname : doublefields) {
			convertfield(mod, fieldname.toString());
			convertfield(org, fieldname.toString());
		}
    
		BasicDBList intfields = (BasicDBList) configdbo.get("intfield");
		for (Object fieldname : intfields) {
			convertint(mod, fieldname.toString());
			convertint(org, fieldname.toString());
		}
		
		BasicDBList datefields = (BasicDBList) configdbo.get("datefield");
		for (Object fieldname : datefields) {
			convertdate(mod, fieldname.toString());
			convertdate(org, fieldname.toString());
		}
		
		/* Remove banner from description */
		String description = mod.getString("Description");
		if (description != null) {
			description = description.replaceAll("<div id=\"listersin-banner\".+?</div>", "");
			mod.put("Description", description);
		}
		
    BasicDBObject query = new BasicDBObject();
    query.put("org.Seller.UserID", userid);
    query.put("org.ItemID", itemid);
    /*
    if (org.containsField("RelistParentID")) {
      query.put("org.ItemID", org.getString("RelistParentID"));
    }
    */
    
    BasicDBObject update = new BasicDBObject();
    
    BasicDBObject set = new BasicDBObject();
    set.put("org", org);
    set.put("mod", mod);
    set.put("UserID", userid);
    
    update.put("$set", set);
    update.put("$push", new BasicDBObject("log", new BasicDBObject(timestamp, "Import from eBay")));
    
    DBCollection itemcoll = db.getCollection(itemcollname);
    itemcoll.update(query, update, true, false);
    
    return;
  }
  
  /**
   * todo: same method in GetItem.java
   * ref: https://jira.mongodb.org/browse/JAVA-260
   */
  private void movefield(DBObject dbo, String field) throws Exception {
    
    String[] path = field.split("\\.", 2);
    
    if (!dbo.containsField(path[0])) return;
    
    String classname = dbo.get(path[0]).getClass().toString();
    
    /* leaf */
    if (path.length == 1) {
      dbo.removeField(path[0]);
      return;
    }
    
    /* not leaf */
    if (classname.equals("class com.mongodb.BasicDBList")) {
      BasicDBList orgdbl = (BasicDBList) dbo.get(path[0]);
      for (int i = 0; i < orgdbl.size(); i++) {
        movefield((DBObject) orgdbl.get(i), path[1]);
      }
    } else if (classname.equals("class com.mongodb.BasicDBObject")) {
      movefield((DBObject) dbo.get(path[0]), path[1]);
    }
    
    return;
  }
  
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
