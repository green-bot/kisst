var app = global.app
var debug = require('debug')('session')

app.use('/portal', function (req, res, next) {
  if (req.user) {
    // The user is  logged in.
    debug('Current user')
    debug(req.user)
    if (!req.session.bots) {
      var Bots = app.locals.dbClient.collection('Bots')
      var q = Bots.find({'accountId': req.user._id}).toArray()
      q.then(function (bots) {
        req.session.bots = bots
        if (bots.length > 0) {
          req.session.currentBot = bots[0]
        } else {
          req.session.currentBot = undefined
          debug('Account has no bots')
        }
        debug(req.user)
      })
    }
    debug(req.session.currentBot)
    debug(req.session.bots)
    next()
  } else {
    // The user is not logged in.
    debug('No current user')
    res.redirect('/login')
  }

})
