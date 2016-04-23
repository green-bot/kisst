var app = global.app
var debug = require('debug')('session')

app.use('/portal', function (req, res, next) {
  if (req.user) {
    debug('Refreshing room')
    var Bots = app.locals.dbClient.collection('Bots')
    var q = Bots.find({'accountId': req.user._id}).toArray()
    q.then(function (bots) {
      req.session.bots = bots
      if (!req.session.currentBot) {
        req.session.currentBot = bots[0]
      }
      debug('Current session is...')
      debug('User')
      debug(req.user)
      debug('Current Bot')
      debug(req.session.currentBot)
      debug('All bots')
      debug(req.session.bots)
      next()
    })
  } else {
    res.redirect('/login')
    next()
  }
})
