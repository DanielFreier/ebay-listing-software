db.getCollection('items.5135bcdbe4b05873d2c3804b').find(
  {
    'membermessages.MessageStatus': 'Unanswered'
  }
).forEach(printjson);
