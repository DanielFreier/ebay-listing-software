db.users.find(
  {
    'message': {'$ne':''}
  },
  {
    'message':1
  }
).forEach(printjson);

db.users.update(
  {
    'message': {'$ne': ''}
  },
	{
    '$set': {'message':''}
  },
	false,
	true);
