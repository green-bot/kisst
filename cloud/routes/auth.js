// Authentication
var app = global.app
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var debug = require('debug')('auth')
var bcrypt = require('bcryptjs')
var crypto = require('crypto')

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(function (username, password, done) {
  var users = app.locals.dbClient.collection('users')
  var query = users.find({'emails.address': username}).limit(1).next()
  debug('I am loking for ' + username)
  query.then(function (user) {
    if (!user) {
      debug('I cant find that user')
      return done(null, false, { message: 'Incorrect username.' })
    }
    // This is a real user. Does the password match?
    var bcryptPass = user.services.password.bcrypt
    var hash = crypto.createHash('sha256')
    hash.update(password)
    var hashedPass = hash.digest('hex')
    var matches = bcrypt.compareSync(hashedPass, bcryptPass)
    if (matches) {
      done(null, user)
    } else {
      return done(null, false, {message: 'Incorrect password.'})
    }
  })
  query.catch(function (err) {
    return done(err)
  })
})
)
passport.serializeUser(function (user, done) {
  done(null, user._id)
})
passport.deserializeUser(function (id, done) {
  var users = app.locals.dbClient.collection('users')
  var query = users.find({'_id': id}).limit(1).next()
  query.then(function (user) {
    done(null, user)
  })
})
app.post('/login',
  passport.authenticate('local', { successRedirect: '/portal/conversations',
                                   failureRedirect: '/login',
                                   failureFlash: false }))
