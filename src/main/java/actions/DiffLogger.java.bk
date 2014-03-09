package ebaytool.actions;

import com.mongodb.*;
import java.io.*;
import org.json.JSONObject;

public class DiffLogger {
	
	public void savediff (String id, String beforestr, String afterstr, String logdir)
		throws Exception {
		
		JSONObject before = new JSONObject(beforestr);
		JSONObject after  = new JSONObject(afterstr);
		
		FileWriter fstream = new FileWriter(logdir+"/"+id+".0.org.js");
		BufferedWriter out = new BufferedWriter(fstream);
		out.write(before.toString(4));
		out.close();
		
		fstream = new FileWriter(logdir+"/"+id+".1.new.js");
		out = new BufferedWriter(fstream);
		out.write(after.toString(4));
		out.close();
		
		return;
	}	
}
