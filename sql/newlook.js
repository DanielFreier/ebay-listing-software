db.users.update(
  {
    email: 'ebppmain@gmail.com'
  },
  {
    $set: {
      newlook: 1,
      status: 'trial'
    }
  }
);
