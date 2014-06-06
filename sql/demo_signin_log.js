db['userlog.5003d951e4b038e43dc1c024']
    .find({
        action: 'Sign in'
    })
    .forEach(printjson);
