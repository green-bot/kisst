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
  users = app.locals.dbClient.collection('users')
  query = users.find('emails.address': username).limit(1).next()
  debug 'I am loking for ' + username
  query.then (user) ->
    if !user
      debug 'I cant find that user'
      return done(null, false, message: 'Incorrect username.')
    # This is a real user. Does the password match?
    bcryptPass = user.services.password.bcrypt
    hash = crypto.createHash('sha256')
    hash.update password
    hashedPass = hash.digest('hex')
    matches = bcrypt.compareSync(hashedPass, bcryptPass)
    if matches
      done null, user
    else
      return done(null, false, message: 'Incorrect password.')
    return
  query.catch (err) ->
    done err
  return
)
passport.serializeUser (user, done) ->
  done null, user._id
  return
passport.deserializeUser (id, done) ->
  users = app.locals.dbClient.collection('users')
  query = users.find('_id': id).limit(1).next()
  query.then (user) ->
    done null, user
    return
  return

app.post '/login', (req, res, next) ->
  passport.authenticate('local', (err, user, info) ->
    debug 'Authed'
    debug req.body

    if err
      return next(err)
    if !user
      return res.redirect('/login')
    req.logIn user, (err) ->
      if err
        return next(err)
      req.session.number = req.body.number
      res.redirect '/portal/conversations'
    return
  ) req, res, next
  return
