package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;
import java.util.zip.*;
import javax.activation.FileDataSource;
import javax.mail.*;
import javax.mail.internet.*;
import javax.mail.util.*;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;

public class downloadFile extends ApiCall {
	
	public downloadFile() throws Exception {
	}
	
	public String call() throws Exception {
		
		callback("");
		
		return "";
	}
	
	public String callback(String site) throws Exception {
		
    String savedir = basedir+"/logs/apicall/downloadFile";
    
    if ((new File(savedir+"/"+site+".xml")).exists()) {
      
      log("already unzipped file exists " + site);
      
    } else {      
      
      FileDataSource fds = new FileDataSource(savedir+"/"+site+".raw");
      MimeMultipart mmp = new MimeMultipart(fds);
      BodyPart bp = mmp.getBodyPart(1);
      
      ZipInputStream zis = new ZipInputStream(bp.getInputStream());
      ZipEntry entry;
      while ((entry = zis.getNextEntry()) != null) {
        log("unzip: "+entry+" "+site);
        int count;
        byte data[] = new byte[4096];
        
        FileOutputStream fos = new FileOutputStream(savedir+"/"+site+".xml");
        BufferedOutputStream dest = new BufferedOutputStream(fos, 4096);
        while ((count = zis.read(data, 0, 4096)) != -1) {
          dest.write(data, 0, count);
        }
        dest.flush();
        dest.close();
      }
      zis.close();
    }
    
		DBCollection coll = db.getCollection(site+".CategorySpecifics");
		if (db.collectionExists(site+".CategorySpecifics")) {
			coll.drop();
		}
    
    /* Import to MongoDB */
    log("importing: " + site);
		FileInputStream fis = new FileInputStream(savedir+"/"+site+".xml");
		BufferedReader br = new BufferedReader(new InputStreamReader(fis));
		
    StringBuilder sb = new StringBuilder();
    BasicDBObject dbo = new BasicDBObject();
    int nodecount = 0;
    int chunkcount = 0;
		String xml = "";
		String line;
		while ((line = br.readLine()) != null) {
			if (line.indexOf("<Recommendations>") > 0) {
        nodecount++;
        chunkcount++;
        sb.append(line);
        break;
      }
    }
		while ((line = br.readLine()) != null) {
      
			if (line.indexOf("<Recommendations>") > 0) {
        nodecount++;
        chunkcount++;
			}
      
      sb.append(line);
      
			if (line.indexOf("</Recommendations>") > 0) {
        
        if (chunkcount < 100) continue;
        
        xml = sb.toString();
        
        xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
          + "<Root xmlns=\"urn:ebay:apis:eBLBaseComponents\">"
          + xml
          + "</Root>";
        
				XMLSerializer xs = new XMLSerializer(); 
				net.sf.json.JSON json = xs.read(xml);
        
				dbo = (BasicDBObject) com.mongodb.util.JSON.parse(json.toString());
        WriteResult result = coll.insert((List<DBObject>) dbo.get("Recommendations"));
        //System.out.println(result.getError());
				
        chunkcount = 0;
        sb = null;
        sb = new StringBuilder();
			}
      
		}
    if (chunkcount > 0) {
      
      xml = sb.toString();
      xml = xml.replaceAll("</GetCategorySpecificsResponse>", "");
      
      xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
        + "<Root xmlns=\"urn:ebay:apis:eBLBaseComponents\">"
        + xml
        + "</Root>";
      
      log("nodecount:"+nodecount+" chunkcount:"+chunkcount);
      
      XMLSerializer xs = new XMLSerializer(); 
      net.sf.json.JSON json = xs.read(xml);
      dbo = (BasicDBObject) com.mongodb.util.JSON.parse(json.toString());
      if (chunkcount == 1) {
        coll.insert((BasicDBObject) dbo.get("Recommendations"));
      } else {
        coll.insert((List<DBObject>) dbo.get("Recommendations"));
      }
    }
    
		return "";
	}
	
}
