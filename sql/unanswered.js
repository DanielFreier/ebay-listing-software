var now = new Date();

/* Each Users */
db.users.find(
  
  /*
  {
    email: 'tarotarotantan@hotmail.com'
  }
  */
  
).sort(
  
  {
    _id: -1
  }
  
).forEach(
  
  function(row) {
    
    var email = row.email;
    
    /* Each eBay IDs */
    for (idx in row.userids2) {
      
      var user = row.userids2[idx];
      
      print(email + ' : ' + user.username);
      
      /* Aggregate */
			var result = db['items.' + row._id].aggregate([
        {
          $match: {
            UserID: user.username
          }
        },
        {
          $project: {
            _id: 0,
            messagestatus: '$membermessages.MessageStatus'
          },
        },
        {
          $unwind: '$messagestatus'
        },
        {
          $group: {
            _id: {
              messagestatus: '$messagestatus'
            },
            messages: {
              $sum: 1
            },
          }
        }
      ]);
      
      /* Create summary object */
      var summary = {};
      for (i in result.result) {
        var resrow = result.result[i];
        
        var messagestatus = resrow._id.messagestatus;
        var messages = resrow.messages;
        
        summary[messagestatus] = NumberInt(messages);
      }
      
      /* Update */
      var updateresult = db.users.update(
        {
          email: email,
          'userids2.username': user.username
        },
        {
          $set: {
            'userids2.$.membermessages': summary
          }
        }
      );
      
    }
  }
);
