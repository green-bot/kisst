app = global.app
debug = require('debug')('session')

userSession = (req, res, next) ->
  unless req.session.passport.user
    debug 'No current user'
    res.redirect '/login'
  debug 'User logged in. Continuing with botId'
  debug req.session.passport.user
  next()

app.use '/portal', userSession
