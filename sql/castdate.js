db.users.find().forEach(
  function(user) {
    
    print('[' + user.email + ']');

    if (user.lastused) {
      print(user.lastused);
      
      str = user.lastused;
      str = str.replace(/\+0000/, '');
      arr = str.split(/[-:\s]/);
      
      //dt = new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4], arr[5]);
      
      db.users.update(
        {
          email: user.email
        }, 
        {
          $set: {
            lastused_at: ISODate(user.lastused)
          }
        }
      );
    }
    
  }
);

