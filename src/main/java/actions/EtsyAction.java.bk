package ebaytool.actions;

import com.mongodb.*;
import com.opensymphony.xwork2.ActionSupport;
import com.opensymphony.xwork2.ActionContext;
import ebaytool.actions.BaseAction;

import java.util.*;

import org.apache.struts2.convention.annotation.Action;
import org.apache.struts2.convention.annotation.Actions;
import org.apache.struts2.convention.annotation.ParentPackage;
import org.apache.struts2.convention.annotation.Result;
import org.apache.struts2.convention.annotation.Results;

import org.scribe.builder.*;
import org.scribe.builder.api.*;
import org.scribe.model.*;
import org.scribe.oauth.*;
//import org.scribe.builder.ServiceBuilder;
//import org.scribe.builder.api.EtsyApi;
//import org.scribe.oauth.OAuthService;

@ParentPackage("json-default")
@Result(name="success",type="json")
public class EtsyAction extends BaseAction {
  
	private LinkedHashMap<String,Object> json;

	private OAuthService service;
	
	public EtsyAction() throws Exception {
		
	}
  
	public LinkedHashMap<String,Object> getJson() {
		return json;
	}
  
	private void buildservice() {
		
		log.debug(configdbo.getString("etsyentrypoint"));
		
		if (configdbo.getString("etsyentrypoint").equals("http://sandbox.openapi.etsy.com/v2")) {
			
			log.debug("[etsy sandbox]");
			
			service = new ServiceBuilder()
				.provider(EtsyApiSandbox.class)
				.apiKey("t32m4aqlbvx9dwl3063hvkgl")
				.apiSecret("j69xhnyq2z")
        .scope("listings_r")
        .debug()
				.build();
			
		} else {
			
			log.debug("[etsy production]");
			
			service = new ServiceBuilder()
				.provider(EtsyApi.class)
				.apiKey("t32m4aqlbvx9dwl3063hvkgl")
				.apiSecret("j69xhnyq2z")
				.build();
			
		}
		
		return;
	}
	
	@Action(value="/etsy/addaccount")
	public String addaccount() throws Exception {
    
		buildservice();
		
    Token requestToken = service.getRequestToken();
    log.debug("requestToken:"+requestToken);
    log.debug("requestToken:"+requestToken.getRawResponse());
    
    session.put("etsy_requesttoken", requestToken);
		
    String authorizationUrl = service.getAuthorizationUrl(requestToken);
    
		json = new LinkedHashMap<String,Object>();
		json.put("url", authorizationUrl);
    
		return SUCCESS;
	}
  
  @Action(value="/etsy/accesstoken")
  public String accesstoken() throws Exception {
    
		buildservice();
		
    String verification_code = ((String[]) parameters.get("verification_code"))[0];
    
    Token requestToken = (Token) session.get("etsy_requesttoken");
    log.debug("requestToken:"+requestToken);
    log.debug("requestToken:"+requestToken.getRawResponse());
    
		Verifier verifier = new Verifier(verification_code);
		
    Token accessToken = service.getAccessToken(requestToken, verifier);
    
    log.debug("accessToken:"+accessToken);
    log.debug("accessToken:"+accessToken.getRawResponse());
    
    String url = configdbo.getString("etsyentrypoint") + "/users/__SELF__";
    
    OAuthRequest request = new OAuthRequest(Verb.GET, url);
    service.signRequest(accessToken, request);
    
    Response response = request.send();
		
    log.debug(response.getCode());
    log.debug(response.getBody());
    
		BasicDBObject users = (BasicDBObject) com.mongodb.util.JSON.parse(response.getBody());
    BasicDBList results = (BasicDBList) users.get("results");
    String login_name = ((BasicDBObject) results.get(0)).getString("login_name");
    log.debug("login_name:"+login_name);
		
		BasicDBObject query = new BasicDBObject();
		query.put("email", session.get("email").toString());

		BasicDBObject atdbo = new BasicDBObject();
		atdbo.put("token", accessToken.getToken());
		atdbo.put("secret", accessToken.getSecret());
		
		BasicDBObject update = new BasicDBObject();
		update.put("$set", new BasicDBObject("etsyids."+login_name, atdbo));
		
		db.getCollection("users").update(query, update);

		json = new LinkedHashMap<String,Object>();
		json.put("login_name", login_name);
		
		return SUCCESS;
  }

	@Action(value="/etsy/listings")
	public String listings() throws Exception {
		
		String login_name = "listersin";
		
		BasicDBObject etsyids = (BasicDBObject) user.get("etsyids");
		BasicDBObject tokendbo = (BasicDBObject) etsyids.get(login_name);
		
    String url = "http://openapi.etsy.com/v2/users/__SELF__/shops";
		
		Token accessToken = new Token(tokendbo.getString("token"), tokendbo.getString("secret"));
		
    OAuthRequest request = new OAuthRequest(Verb.GET, url);
    service.signRequest(accessToken, request);
		
    Response response = request.send();
		
    log.debug(response.getCode());
    log.debug(response.getBody());
		
		return SUCCESS;
	}

	@Action(value="/etsy/createlisting")
	public String createlisting() throws Exception {
		
		String login_name = "listersin";
		
		BasicDBObject etsyids = (BasicDBObject) user.get("etsyids");
		BasicDBObject tokendbo = (BasicDBObject) etsyids.get(login_name);
		
    String url = "http://sandbox.openapi.etsy.com/v2/listings";
		
		Token accessToken = new Token(tokendbo.getString("token"), tokendbo.getString("secret"));
		
    OAuthRequest request = new OAuthRequest(Verb.POST, url);
		
    request.addBodyParameter("quantity", "1");
    request.addBodyParameter("title", "create via api");
    request.addBodyParameter("description", "test item");
    request.addBodyParameter("price", "10");
    request.addBodyParameter("state", "draft");
    request.addBodyParameter("shipping_profile_id", "115060096");
    request.addBodyParameter("category_id", "69152243");
    request.addBodyParameter("who_made", "i_did");
    request.addBodyParameter("is_supply", "true");
    request.addBodyParameter("when_made", "2010_2012");
		
    service.signRequest(accessToken, request);
		
    Response response = request.send();
		
    log.debug(response.getCode());
    log.debug(response.getBody());
    
		return SUCCESS;
	}
  
  @Action(value="/etsy/call")
  public String call() throws Exception {
    
		buildservice();
		
    String method = ((String[]) parameters.get("method"))[0];
    String uri    = ((String[]) parameters.get("uri"))[0];
    
		String login_name = "listersin";
		
		BasicDBObject etsyids = (BasicDBObject) user.get("etsyids");
		BasicDBObject tokendbo = (BasicDBObject) etsyids.get(login_name);
		
    String url = configdbo.getString("etsyentrypoint") + uri;
		
		Token accessToken = new Token(tokendbo.getString("token"), tokendbo.getString("secret"));
		
    OAuthRequest request = new OAuthRequest(Verb.POST, url);
    if (method.equals("POST")) {
      request = new OAuthRequest(Verb.POST, url);
    } else if (method.equals("GET")) {
      request = new OAuthRequest(Verb.GET, url);
    }

    for (String key : parameters.keySet()) {
      if (key.equals("method")) continue;
      if (key.equals("uri")) continue;
      
      String[] vals = parameters.get(key);
      
      request.addBodyParameter(key, vals[0]);
    }
    
    service.signRequest(accessToken, request);
		
    Response response = request.send();
		
    log.debug(response.getCode());
    log.debug(response.getBody());
    log.debug(response.getHeaders());
    
    return SUCCESS;
  }
  
}
