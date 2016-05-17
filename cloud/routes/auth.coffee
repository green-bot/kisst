# Authentication
app = global.app
passport = require('passport')
LocalStrategy = require('passport-local').Strategy
debug = require('debug')('auth')
bcrypt = require('bcryptjs')
crypto = require('crypto')
app.use passport.initialize()
app.use passport.session()
passport.use new LocalStrategy((username, password, done) ->
  debug 'Auth local'
  bots = app.locals.dbClient.collection('Bots')
  query = bots.find('passcode': password).limit(1).next()
  debug 'I am loking for ' + password
  query.then (bot) ->
    if !bot
      debug 'I cant find that bot'
      return done(null, false, message: 'Incorrect passcode.')
    debug 'I found it!'
    debug bot
    done null, bot
  query.catch (err) ->
    done err
)

passport.serializeUser (bot, done) ->
  done null, bot._id
  return

passport.deserializeUser (id, done) ->
  bots = app.locals.dbClient.collection('Bots')
  query = bots.find('_id': id).limit(1).next()
  query.then (bot) ->
    done null, bot
    return
  return

app.post '/login', (req, res, next) ->
  debug 'Requesting auth'
  passport.authenticate('local', (err, user, info) ->
    debug 'Auth called back'
    debug err, user, info
    req.session.currentBot = user
    if err
      return next(err)
    if !user
      return res.redirect('/login')
    debug 'Authenticated'
    req.logIn user, (err) ->
      if err
        return next(err)
      debug 'Logged in'
      res.redirect '/portal/conversations'
    return
  ) req, res, next
  return
