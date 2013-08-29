package ebaytool.actions;
 
import com.mongodb.*;
import com.opensymphony.xwork2.ActionSupport;
import java.io.*;
import java.net.Socket;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import javax.servlet.ServletContext;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import net.sf.json.xml.XMLSerializer;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.apache.struts2.interceptor.ParameterAware;
import org.apache.struts2.interceptor.ServletRequestAware;
import org.apache.struts2.interceptor.ServletResponseAware;
import org.apache.struts2.interceptor.SessionAware;
import org.apache.struts2.util.ServletContextAware;
 
public class BaseAction extends ActionSupport implements ServletContextAware,
																												 SessionAware,
																												 ServletRequestAware,
																												 ServletResponseAware,
																												 ParameterAware {
	
	protected ServletContext context = null;
	protected Map<String, Object> session = null;
	protected Map<String, String[]> parameters = null;
	protected HttpServletRequest request = null;
	protected HttpServletResponse response = null;
	
	protected DB db;
	protected BasicDBObject user;
	protected BasicDBObject configdbo;
	
	protected int daemonport;
	protected String basedir;
	protected String version;
	protected String basetimestamp;
	
	protected Logger log = Logger.getLogger(this.getClass());
	
	public BaseAction() throws Exception {
	}
	
	@Override
	public void setServletContext(ServletContext context) {
		this.context = context;
		
		try {
			
			basedir = context.getRealPath("");
			basedir = basedir.replace("/usr/local/apache-tomcat/webapps", "/var/www");
			version = basedir;
			
			basedir = basedir.replaceAll("##.+$", "");
			version = version.replaceAll("^.+##", "");
			
			configdbo = convertXML2DBObject(readfile(basedir+"/config/config.xml"));
			daemonport = Integer.parseInt(configdbo.getString("daemonport"));
			
			MongoConnect mc = MongoConnect.getInstance(configdbo.getString("mongohost"),
																								 configdbo.getString("database"));
			db = mc.getDB();
			
			// timestamp
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ssZ");
			sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
			Date now = new Date();
			basetimestamp = sdf.format(now);
			
      for (Enumeration enm=request.getHeaderNames(); enm.hasMoreElements();) {
        String hdname = (String) enm.nextElement();
      }
			
			if (session.get("email") == null) {
				if (request.getCookies() != null) {
					for (Cookie c : request.getCookies()) {
						if (c.getName().equals("JSESSIONID")) {
							
							user = (BasicDBObject) db.getCollection("users")
								.findOne(new BasicDBObject("JSESSIONID", c.getValue()));
							if (user != null) {
								log.debug("restore session [" + user.getString("email") + "]");
								session.put("email", user.getString("email"));
							}
							
							break;
						}
					}
				}
			}
			
			// todo: exclude "canceled" user?
			if (session.get("email") != null) {
        
				BasicDBObject query = new BasicDBObject();
				query.put("email", session.get("email").toString());
				user = (BasicDBObject) db.getCollection("users").findOne(query);
        
        boolean isadmin = false;
        for (Cookie c : request.getCookies()) {
          if (!c.getName().equals("admin")) continue;
          isadmin = true;
          break;
        }
        if (session.get("admin") != null) {
          isadmin = true;
        }
        
        if (isadmin) {
          
        } else {
					
          BasicDBObject set = new BasicDBObject();
          set.put("lastused", basetimestamp);
          set.put("lastused_at", now);
          set.put("useragent", request.getHeader("user-agent"));
					
          db.getCollection("users").update(query, new BasicDBObject("$set", set));
					
					for (Cookie c : request.getCookies()) {
						if (c.getName().equals("JSESSIONID")) {
							
							set = new BasicDBObject();
							set.put("JSESSIONID", c.getValue());
							
							db.getCollection("users").update(query, new BasicDBObject("$set", set));
							
							break;
						}
					}
        }
      }
			
		} catch (Exception e) {
			
			e.printStackTrace();
			
		}
	}
	
	@Override
	public void setSession(Map<String, Object> session) {
		this.session = session;
	}
	
	@Override
	public void setServletRequest(HttpServletRequest request) {
		this.request = request;
	}
	
	@Override
	public void setServletResponse(HttpServletResponse response) {
		this.response = response;
	}
	
	@Override
	public void setParameters(Map<String, String[]> parameters) {
		this.parameters = parameters;
	}
	
	// todo: many same methods...
	public BasicDBObject convertXML2DBObject(String xml) {
		
		XMLSerializer xmlSerializer = new XMLSerializer(); 
		//xmlSerializer.setTypeHintsCompatibility(true);
		xmlSerializer.setTypeHintsEnabled(false);
		
		net.sf.json.JSON json = xmlSerializer.read(xml);
		
		BasicDBObject dbobject = (BasicDBObject) com.mongodb.util.JSON.parse(json.toString());
		
		return dbobject;
	}
	
	public String readfile(String filename) throws Exception {
		
		String data = "";
		
		//FileReader fr = new FileReader(filename);
		Reader reader = new InputStreamReader(new FileInputStream(filename), "utf-8");
		BufferedReader br = new BufferedReader(reader);
		String line;
		while ((line = br.readLine()) != null) {
			data = data + line;
		}
		br.close();
		
		return data;
	}

	public String writesocket(String[] args) throws Exception {
    
		Socket socket = new Socket("localhost", daemonport);
		BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
		
		out.println(StringUtils.join(args, "\n")+"\n\n");
		
		String result = in.readLine();
		
		out.close();
		in.close();
		socket.close();
		
		return result;
	}
    
	public String writesocket_async(String[] args) throws Exception {
    
		Socket socket = new Socket("localhost", daemonport);
		PrintWriter out = new PrintWriter(socket.getOutputStream(), true);
		
		out.println(StringUtils.join(args, "\n")+"\n\n");
		
		out.close();
		socket.close();
        
		return "";
	}
  
	public void updatemessage(String email, boolean hasnext, String message) {
    
    BasicDBObject msgdbo = new BasicDBObject();
    msgdbo.put("datetime", new Date());
    msgdbo.put("hasnext", hasnext);
    msgdbo.put("message", message);
		
		db.getCollection("users").update
			(new BasicDBObject("email", email),
			 new BasicDBObject("$set", new BasicDBObject("message", msgdbo)));
		
		/*
		db.getCollection("users").update
			(new BasicDBObject("email", email),
			 new BasicDBObject("$push", new BasicDBObject("messages", msgdbo)));
		*/
		
		log.debug(email + " [" + message + "]");
    
		return;
	}
  
}
