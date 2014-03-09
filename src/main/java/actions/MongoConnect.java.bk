package ebaytool.actions;

import com.mongodb.*;
import org.apache.log4j.Logger;

public class MongoConnect {
	
	private static MongoConnect _instance;
	private DB db;
	
	private MongoConnect(String host, String database) throws Exception {
		
		Logger log = Logger.getLogger(this.getClass());
		log.debug("connecting to MongoDB ["+database+"]");
		
		db = new Mongo(host).getDB(database);
	}
	
	public static synchronized MongoConnect getInstance(String host, String database) throws Exception {
		
		if (_instance == null) {
			_instance = new MongoConnect(host, database);
		}
		
		return _instance;
	}
	
	public DB getDB() {
		return db;
	}
}
