db.users.remove(
  {
    _id: ObjectId("536971e5f81cc0fc26000025"),
    email: 'microbytek@gmail.com'
  },
  {
    lastused_at: true
  }
);
