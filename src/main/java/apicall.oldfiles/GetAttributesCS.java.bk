package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.*;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang.StringEscapeUtils;

public class GetAttributesCS extends ApiCall {
	
	private String productid;
	
	public GetAttributesCS() throws Exception {
	}
	
	public String call() throws Exception {
		
		DBObject row = db.getCollection("US.eBayDetails")
			.findOne(null, new BasicDBObject("SiteDetails", 1));
		BasicDBList sitedetails = (BasicDBList) row.get("SiteDetails");
		for (Object sitedbo : sitedetails) {
			
			String  site   = ((BasicDBObject) sitedbo).getString("Site");
			Integer siteid = Integer.parseInt(((BasicDBObject) sitedbo).getString("SiteID"));
			log(site);

			if (!site.equals("US")) break;
			
			BasicDBObject reqdbo = new BasicDBObject();
			reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", admintoken));
			reqdbo.append("WarningLevel", "High");
			reqdbo.append("DetailLevel",  "ReturnAll");
			reqdbo.append("MessageID",    site);
			reqdbo.append("IncludeCategoryMappingDetails", "true");
			
			String requestxml = convertDBObject2XML(reqdbo, "GetAttributesCS");
			Future<String> future =
				pool18.submit(new ApiCallTask(siteid, requestxml, "GetAttributesCS", "filename"));
			future.get();
		}
		
		return "";
	}
	
	public String callback(String filename) throws Exception {
		
		String responsexml = readfile(filename);
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		
		/*
		XMLSerializer xmlSerializer = new XMLSerializer(); 
		xmlSerializer.setTypeHintsEnabled(false);
		net.sf.json.JSON json = xmlSerializer.readFromFile(filename);
		BasicDBObject resdbo = (BasicDBObject) com.mongodb.util.JSON.parse(json.toString());
		*/
		
		String site = resdbo.getString("CorrelationID");
		if (site == null) {
			site = "US";
		}
		
		String data = resdbo.getString("AttributeData");
		String decoded = StringEscapeUtils.unescapeHtml(data);
		
		decoded = decoded.replaceAll("&", "&amp;");
		decoded = decoded.replace("<eBay>", "<eBay><SelectedAttributes><AttributeSet id='5918' categoryId='171485'/></SelectedAttributes>");
		
		writelog("GetAttributesCS/"+site+".decoded.xml", decoded);
		
		String logpath = "/var/www/ebaytool.jp/logs/apicall";
		
		TransformerFactory factory = TransformerFactory.newInstance();
		Transformer transformer = factory.newTransformer
			(new StreamSource(logpath+"/GetAttributesXSL/US.syi_attributes.xsl"));
		
		transformer.transform
			(new StreamSource(logpath+"/GetAttributesCS/"+site+".decoded.xml"),
			 new StreamResult(new FileOutputStream(logpath+"/GetAttributesCS/"+site+".html")));
		
		return "";
	}
}
