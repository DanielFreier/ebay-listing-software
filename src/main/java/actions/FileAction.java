package ebaytool.actions;

import au.com.bytecode.opencsv.CSVReader;
import com.mongodb.*;
import ebaytool.actions.BaseAction;

import java.io.*;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.io.FileUtils;
import org.apache.struts2.convention.annotation.Action;
import org.apache.struts2.convention.annotation.Result;
import org.apache.struts2.convention.annotation.Results;
import org.bson.types.ObjectId;

public class FileAction extends BaseAction {
  
	private List<File>   fileUpload            = new ArrayList<File>();
	private List<String> fileUploadContentType = new ArrayList<String>();
	private List<String> fileUploadFileName    = new ArrayList<String>();
	private List<String> savedfilename         = new ArrayList<String>();
  
	public FileAction() throws Exception {
	}
  
	/**
   * ref: http://www.mkyong.com/struts2/struts-2-upload-multiple-files-example/
   */
  @Action(value="/file/upload", results={@Result(name="success",location="uploaded.jsp")})
	public String upload() throws Exception {
    
		String savedir  = basedir + "/webroot/itemimage";
    String user_id  = user.getString("_id");
		String id       = ((String[]) parameters.get("id"))[0];
		String userid   = ((String[]) parameters.get("userid"))[0];
		String divclass = ((String[]) parameters.get("divclass"))[0];
    log.debug("divclass:"+divclass);
    
		int i = 0;
    for (File file: fileUpload) {
      
			String timestampstr = basetimestamp.replaceAll("[-+Z\\s:]", "");
			String extension = fileUploadFileName.get(i).replaceAll("^.+\\.", "");
			String tmpname = user_id+"_"+id+"_"+timestampstr+"_"+i+"."+extension;
			
			File savefile = new File(savedir + "/" + tmpname);
      FileUtils.copyFile(file, savefile);
			
      String url = "http://" + configdbo.getString("hostname") + "/itemimage/" + tmpname;
			
			String[] args = {"UploadSiteHostedPictures", 
                       session.get("email").toString(),
                       userid,
                       url};
			
			String epsurl = writesocket(args);
			
			savedfilename.add(i, epsurl);
      
			i++;
    }
    
		return SUCCESS;
	}
	
  @Action(value="/file/csvupload", results={@Result(name="success",location="csvuploaded.jsp")})
  public String csvupload() throws Exception {
    
		String savedir = basedir + "/data/uploaded";
    String user_id = user.getString("_id");
		String userid  = ((String[]) parameters.get("userid"))[0];
    String tmpname = "";
    
    for (File file: fileUpload) {
      
			String timestampstr = basetimestamp.replaceAll("[-+Z\\s:]", "");
			String extension = fileUploadFileName.get(0).replaceAll("^.+\\.", "");
			tmpname = user_id+"_"+timestampstr+"."+extension;
			
			File savefile = new File(savedir + "/" + tmpname);
      FileUtils.copyFile(file, savefile);
    }
		
    /* Read config file */
    BasicDBObject kvmap = new BasicDBObject();
		FileReader fr = new FileReader(basedir + "/config/csv-turbolister.conf");
		BufferedReader br = new BufferedReader(fr);
		String line;
		while ((line = br.readLine()) != null) {
      
      String[] tmp = line.split(" = ");
      
      if (tmp.length != 2) continue;
      
      tmp[0] = tmp[0].trim();
      tmp[1] = tmp[1].trim();
      
      if (tmp[1].equals("")) continue;
      
      tmp[1] = tmp[1].replace("_SDCSR",  "ShippingDetails.CalculatedShippingRate");
      tmp[1] = tmp[1].replace("_SDSSO",  "ShippingDetails.ShippingServiceOptions");
      tmp[1] = tmp[1].replace("_SDISSO", "ShippingDetails.InternationalShippingServiceOption");
      tmp[1] = tmp[1].replace("_VPVSPS", "Variations.Pictures.VariationSpecificPictureSet");
      tmp[1] = tmp[1].replace("_BRD",    "BuyerRequirementDetails");
      
      kvmap.put(tmp[0], tmp[1]);
		}
		br.close();
    
		DBCollection coll = db.getCollection("items."+user.getString("_id"));
    
    /* Parse CSV file */
    CSVReader csvreader = new CSVReader(new FileReader(savedir + "/" + tmpname));
    //CSVReader csvreader = new CSVReader(new FileReader(savedir + "/" + tmpname), ';');
    String[] cols;
    String[] colnames = new String[1];
    int rowidx = 0;
    int colidx = 0;
    int colidxofcurrency = 0;
    while ((cols = csvreader.readNext()) != null) {
      
      /* Title row */
      if (rowidx == 0) {
        colnames = new String[cols.length];
        colidx = 0;
        for (String col : cols) {
          colnames[colidx] = col;
          log.debug(colidx + ":" + col);
          
					if (col.equals("Currency")) {
						colidxofcurrency = colidx;
					}
          
          colidx++;
        }
        
        rowidx++;
        continue;
      }
      
      BasicDBObject mod = new BasicDBObject();
      
      /* Data row */
      colidx = 0;
      for (String colval : cols) {
        
        Object valobj = colval;
        
        if (kvmap.containsField(colnames[colidx]) && !colval.equals("")) {
          String colkey = kvmap.getString(colnames[colidx]);
					
          if (colkey.equals("ListingDuration")) {
            if (!colval.equals("GTC")) {
              valobj = "Days_" + colval;
            }
          } else if (colkey.matches(".+ShipToLocation")) {
            if (colval.matches(".+\\|.+")) {
              valobj = colval.split("\\|");
            }
          }
					
          putsub(mod, colkey.split("\\."), valobj);
					
					// add currency symbol
					if (colkey.matches(".+(Cost|Price).#text")) {
						String colkey2 = colkey.replace("#text", "@currencyID");
						putsub(mod, colkey2.split("\\."), cols[colidxofcurrency]);
					}
        }
        
        colidx++;
      }
      
			ObjectId newid = new ObjectId();
      
      BasicDBObject item = new BasicDBObject();
			item.put("_id", newid);
      item.put("mod", mod);
      item.put("UserID", userid);
			
			BasicDBList logdbl = new BasicDBList();
			logdbl.add(new BasicDBObject(basetimestamp, "Imported from csv"));
			item.put("log", logdbl);
      
			WriteResult result = coll.insert(item, WriteConcern.SAFE);
			log.debug("csv item: "+result.getError());
      
      rowidx++;
    }
    
    return SUCCESS;
  }
  
  private void putsub(Object dbo, String[] path, Object val) {
    
    String classname = dbo.getClass().toString();
    
    //log.debug("putsub[" + StringUtils.join(path, ".") + "][" + val + "]");
    //log.debug(" -> " + classname);
		
    if (path.length == 1) {
      
			if (classname.equals("class com.mongodb.BasicDBList")) {
				((BasicDBList) dbo).put(path[0], val);
      } else {
				((BasicDBObject) dbo).put(path[0], val);
			}
			
		} else {
      
      String[] newpath = new String[path.length-1];
      for (int i=1; i<path.length; i++) {
        newpath[i-1] = path[i];
      }
			
			if (classname.equals("class com.mongodb.BasicDBList")) {

				int idx = Integer.parseInt(path[0]) - 1;
				String idxstr = Integer.toString(idx);
				
				if (!((BasicDBList) dbo).containsField(idxstr)) {
					((BasicDBList) dbo).put(idxstr, new BasicDBObject());
				}
				
				putsub(((BasicDBList) dbo).get(idxstr), newpath, val);
				
			} else {
				
				if (!((BasicDBObject) dbo).containsField(path[0])) {
					if (path[1].matches("[0-9]+")) {
						((BasicDBObject) dbo).put(path[0], new BasicDBList());
					} else {
						((BasicDBObject) dbo).put(path[0], new BasicDBObject());
					}
				}
				
				putsub(((BasicDBObject) dbo).get(path[0]), newpath, val);
			}
      
		}
    
    return;
  }
  
  
  public List<File> getFileUpload() {
		return fileUpload;
	}
  
	public void setFileUpload(List<File> fileUpload) {
		this.fileUpload = fileUpload;
	}
  
	public List<String> getFileUploadContentType() {
		return fileUploadContentType;
	}
  
	public void setFileUploadContentType(List<String> fileUploadContentType) {
		this.fileUploadContentType = fileUploadContentType;
	}
  
	public List<String> getFileUploadFileName() {
		return fileUploadFileName;
	}
    
	public void setFileUploadFileName(List<String> fileUploadFileName) {
		this.fileUploadFileName = fileUploadFileName;
	}
	
	public List<String> getSavedfilename() {
		return savedfilename;
	}
  
}
