app = global.app
debug = require('debug')('toplevel')
app.get '/login', (req, res) ->
  res.render 'login'
  return
app.get '/logout', (req, res) ->
  req.session.currentBot = undefined
  req.session.bots = undefined
  req.logout()
  res.redirect '/'
  return
app.get '/portal/config/nexmo', (req, res) ->
  res.render 'nexmo'
  return
app.get '/reset_page', (req, res) ->
  res.render 'reset_page'
  return
app.get '/register', (req, res) ->
  res.render 'register'
  return
