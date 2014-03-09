package ebaytool.actions;

import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URL;
import java.io.*;
import java.util.*;

import org.apache.struts2.convention.annotation.Action;
import org.apache.struts2.convention.annotation.ParentPackage;
import org.apache.struts2.convention.annotation.Result;
import org.apache.struts2.convention.annotation.Results;

public class ImageAction extends BaseAction {
	
  private InputStream inputStream;
	private String contentType;
	private Integer contentLength;
  
  public InputStream getInputStream() {
    return inputStream;
  }
	
	public String getContentType() {
		return contentType;
	}
	
	public Integer getContentLength() {
		return contentLength;
	}
  
  public ImageAction() throws Exception {
  }
	
	@Action(value="/image/index", results={@Result(name="success",type="stream")})
  public String execute() throws Exception {
		
    String urlstring = ((String[]) parameters.get("url"))[0];
		
    URL url = new URL(urlstring);
		
		String  proxyhost = configdbo.getString("proxyhost");
		Integer proxyport = Integer.parseInt(configdbo.getString("proxyport"));
		Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyhost, proxyport));
		
		HttpURLConnection conn = (HttpURLConnection) url.openConnection(proxy);
		
		conn.setUseCaches(true);
		
    conn.connect();
		
		contentType = conn.getContentType();
		contentLength = conn.getContentLength();
		
		Map<String,List<String>> headers = conn.getHeaderFields();
		for (String key: headers.keySet ()) {
			response.setHeader(key, conn.getHeaderField(key));
		}
		
    inputStream = conn.getInputStream();
		
    return SUCCESS;
  }  
  
}
