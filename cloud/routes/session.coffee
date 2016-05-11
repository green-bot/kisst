app = global.app
debug = require('debug')('session')

userSession = (req, res, next) ->
  debug 'Session'
  if req.session.passport.user
    userId = req.session.passport.user
    # The user is  logged in.
    debug 'Current user'
    debug userId
    Bots = app.locals.dbClient.collection('Bots')
    q = Bots.find('accountId': userId).toArray()
    q.then((bots) ->
      debug 'This account has the following bots'
      debug bots
      req.session.bots = bots
      next()
      return
    ).catch (err) ->
      debug 'Error thrown'
      debug err
      return
  else
    # The user is not logged in.
    debug 'No current user'
    res.redirect '/login'
  return

app.use '/portal', userSession
