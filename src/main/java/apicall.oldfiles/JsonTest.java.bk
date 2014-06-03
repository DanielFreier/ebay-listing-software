package ebaytool.apicall;

import java.io.*;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.xml.XMLSerializer;
import org.w3c.dom.*;
import org.xml.sax.SAXException;

public class JsonTest extends ApiCall {
	
	private String filename;
	
	public JsonTest() throws Exception {
	}
	
	public JsonTest(String filename) throws Exception {
		this.filename = filename;
	}
	
	public String call() throws Exception {
		
		String dir = "/var/www/ebaytool.jp/logs/apixml";
		
		String jss = readfile(dir+"/"+filename);
		
					JSONObject jso = JSONObject.fromObject(jss);
					JSONArray tmpitems = jso.getJSONArray("AddItemRequestContainer");
					for (Object tmpitem : tmpitems) {
						JSONObject tmpi = ((JSONObject) tmpitem).getJSONObject("Item");
						
						/* expand array elements */
						if (tmpi.has("PaymentAllowedSite") && tmpi.get("PaymentAllowedSite")
							.getClass().toString().equals("class net.sf.json.JSONArray")) {
							tmpi.getJSONArray("PaymentAllowedSite").setExpandElements(true);
						}
						
						if (tmpi.has("PaymentMethods") && tmpi.get("PaymentMethods")
							.getClass().toString().equals("class net.sf.json.JSONArray")) {
							tmpi.getJSONArray("PaymentMethods").setExpandElements(true);
						}
						
						if (((JSONObject) tmpi.get("PictureDetails")).has("PictureURL")
							&& ((JSONObject) tmpi.get("PictureDetails")).get("PictureURL")
							.getClass().toString().equals("class net.sf.json.JSONArray")) {
							((JSONObject) tmpi.get("PictureDetails"))
								.getJSONArray("PictureURL").setExpandElements(true);
						}
						
						if (((JSONObject) tmpi.get("ShippingDetails")).has("ShippingServiceOptions")
							&& ((JSONObject) tmpi.get("ShippingDetails")).get("ShippingServiceOptions")
							.getClass().toString().equals("class net.sf.json.JSONArray")) {
							((JSONObject) tmpi.get("ShippingDetails"))
								.getJSONArray("ShippingServiceOptions").setExpandElements(true);
						}
					}			
					jso.getJSONArray("AddItemRequestContainer").setExpandElements(true);
					
					XMLSerializer xmls = new XMLSerializer();
					xmls.setObjectName("AddItemsRequest");
					xmls.setNamespace(null, "urn:ebay:apis:eBLBaseComponents");
					xmls.setTypeHintsEnabled(false);
					
					String requestxml = xmls.write(jso);
		
		return "";
	}
}
