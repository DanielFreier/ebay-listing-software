package ebaytool.apicall;

import com.mongodb.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;

public class GetProductSearchResults extends ApiCall {
	
	private String csid;
	private String words;
	
	public GetProductSearchResults() throws Exception {
	}
	
	public GetProductSearchResults(String csid, String words) throws Exception {
		this.csid  = csid;
		this.words = words;
	}
	
	public String call() throws Exception {
		
		BasicDBObject reqdbo = new BasicDBObject();
		reqdbo.append("RequesterCredentials", new BasicDBObject("eBayAuthToken", admintoken));
		reqdbo.append("WarningLevel", "High");
		reqdbo.append("DetailLevel",  "ReturnAll");
		reqdbo.append("MessageID",    "US");
		
		BasicDBObject productsearch = new BasicDBObject();
		productsearch.append("QueryKeywords", words);
		productsearch.append("CharacteristicSetIDs", new BasicDBObject("ID", csid));
		productsearch.append("Pagination", new BasicDBObject("EntriesPerPage", "20"));
		reqdbo.append("ProductSearch", productsearch);
		
		String requestxml = convertDBObject2XML(reqdbo, "GetProductSearchResults");
		Future<String> future =
			pool18.submit(new ApiCallTask(0, requestxml, "GetProductSearchResults"));
		String result = future.get();
		
		return result;
	}
	
	public String callback(String responsexml) throws Exception {
		
		BasicDBObject resdbo = convertXML2DBObject(responsexml);
		String site = resdbo.getString("CorrelationID");
		writelog("GetProductSearchResults/"+site+".xml", responsexml);
		
		//String json = resdbo.toString();
		
		return responsexml;
	}
}
