db.users.update(
  {
    email: 'demo@listers.in'
  },
  {
    $set: {
      newlook: 1
    }
  }
);
