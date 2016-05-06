var app = global.app
var debug = require('debug')('toplevel')

app.get('/login', function (req, res) {
  res.render('login')
})
app.get('/logout', function (req, res) {
  req.session.currentBot = undefined
  req.session.bots = undefined
  req.logout()
  res.redirect('/')
})

app.get('/portal/config/nexmo', function (req, res) {
  res.render('nexmo')
})
app.get('/reset_page', function (req, res) {
  res.render('reset_page')
})
app.get('/register', function (req, res) {
  res.render('register')
})
