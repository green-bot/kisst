var app = global.app
var debug = require('debug')('session')

app.use('/portal', function (req, res, next) {
  if (req.user) {
    // The user is  logged in.
    debug('Current user')
    debug(req.user)
    var Bots = app.locals.dbClient.collection('Bots')
    var q = Bots.find({'accountId': req.user._id}).toArray()
    q.then(function (bots) {
      debug('This account has the following bots')
      debug(bots)
      req.session.bots = bots
      next()
    })
    .catch(function (err) {
      debug('Error thrown')
      debug(err)
    })
  } else {
    // The user is not logged in.
    debug('No current user')
    res.redirect('/login')
  }
})
