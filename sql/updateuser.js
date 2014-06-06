var now = new Date();

db.users.update(
  {
    /*
    email: {
      $ne: 'cptechworld@gmail.com'
    }
    */
    //email: 'tarotarotantan@hotmail.com',
    'period.end': {
      $lt: now
    }
  },
  {
    $set: {
      'period.end': ISODate('2014-05-31 00:00:00')
	  }
  },
  {
    multi: true
  }
);
