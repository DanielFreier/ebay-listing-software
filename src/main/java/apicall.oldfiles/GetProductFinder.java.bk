package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.apache.commons.lang.StringEscapeUtils;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.w3c.dom.Node;

public class GetProductFinder extends ApiCall {
	
	public GetProductFinder() throws Exception {
	}
	
	public String call() throws Exception {
		
		DBCursor cur = db.getCollection("US.eBayDetails.SiteDetails").find();
		Integer cnt = cur.count();
		while (cur.hasNext()) {
			DBObject row = cur.next();
			
			String  site   = row.get("Site").toString();
			Integer siteid = Integer.parseInt(row.get("SiteID").toString());

			if (!site.equals("HongKong")) continue;
			
			BasicDBObject reqdbo = new BasicDBObject();
			reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", admintoken));
			reqdbo.append("WarningLevel", "High");
			reqdbo.append("DetailLevel",  "ReturnAll");
			reqdbo.append("MessageID",    site);
			
			String requestxml = convertDBObject2XML(reqdbo, "GetProductFinder");
			
			Future<String> future =
				pool18.submit(new ApiCallTask(siteid, requestxml, "GetProductFinder"));
			future.get();
		}
		
		return "";
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		String site = resdbo.getString("CorrelationID");
		if (site == null) {
			site = "US";
		}
		writelog("GetProductFinder/"+site+".xml", responsexml);
		
		String data = resdbo.getString("ProductFinderData");
		String decoded = StringEscapeUtils.unescapeHtml(data);
		
		writelog("GetProductFinder/"+site+".decoded.xml", decoded);
		
		BasicDBObject dbo = convertXML2DBObject(decoded);
		
		for (Object idx : dbo.keySet()) {
			String classname = dbo.get(idx).getClass().toString();
			log(classname+" "+idx.toString());
		}
		
		File fXmlFile = new File
			("/var/www/ebaytool.jp/logs/apicall/GetProductFinder/"+site+".decoded.xml");
		DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
		DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
		Document doc = dBuilder.parse(fXmlFile);
		//doc.getDocumentElement().normalize();
		
		NodeList nList = doc.getElementsByTagName("ProductFinder");
		
		for (int temp = 0; temp < nList.getLength(); temp++) {
			Node nNode = nList.item(temp);
			if (nNode.getNodeType() == Node.ELEMENT_NODE) {
				Element eElement = (Element) nNode;

				// ref: http://www.mkyong.com/java/how-to-create-xml-file-in-java-dom/
				// ref: http://www.genedavis.com/library/xml/java_dom_xml_creation.jsp
				// ref: http://www.java2s.com/Code/JavaAPI/javax.xml.transform/OutputKeysOMITXMLDECLARATION.htm
				
				TransformerFactory transformerFactory = TransformerFactory.newInstance();
				Transformer transformer = transformerFactory.newTransformer();
				transformer.setOutputProperty(OutputKeys.OMIT_XML_DECLARATION, "yes");
				transformer.setOutputProperty(OutputKeys.INDENT, "yes");
				
				DOMSource source = new DOMSource(eElement);
				
				StringWriter sw = new StringWriter();
				StreamResult result = new StreamResult(sw);
				
				transformer.transform(source, result);
				
				String xmlString = sw.toString();
				
				log("====\n\n"+xmlString+"\n\n");
			}
		}
		
		return "";
	}
}
