db.createUser({
  user: 'egg_cnode',
  pwd: 'egg_cnode',
  roles: [
    {
      role: 'readWrite',
      db: 'egg_cnode'
    }
  ]
})

db.egg_cnode.insert({
  'cnode': 'egg-cnode'
})
