var app = global.app
var debug = require('debug')('toplevel')

app.locals.menu = [{
  id: 'dashboard',
  name: 'Home',
  title: 'Home',
  icon: 'fa-home',
  active: false,
  url: '/'
}, {
  id: 'conversations',
  name: 'Conversations',
  title: 'Conversations',
  icon: 'fa-building-o',
  active: false,
  url: '/conversations'
}, {
  id: 'config',
  name: 'Settings',
  title: 'Settings',
  icon: 'fa-gears',
  active: false,
  url: '/config'
}, {
  id: 'help',
  name: 'Help',
  title: 'Help',
  icon: 'fa-question-circle',
  active: false,
  url: 'http://kisst.zendesk.com'
}, {
  id: 'share',
  name: 'Share',
  title: 'Share',
  icon: 'fa-share',
  active: false,
  url: 'http://kissthelp.zendesk.com'
}, {
  id: 'logout',
  name: 'Logout',
  title: 'Logout',
  icon: 'fa-sign-out',
  active: false,
  url: '/logout'
}]
app.get('/login', function (req, res) {
  res.render('login')
})
app.get('/logout', function (req, res) {
  req.session.currentBot = undefined
  req.session.bots = undefined
  req.logout()
  res.redirect('/')
})

app.get('/portal', function (req, res) {
  var anyBots = false
  if (Array.isArray(req.session.bots)) {
    debug('bots is an array')
    if (req.session.bots.length > 0) {
      debug('The length is ' + req.session.bots.length)
      anyBots = true
      debug('We have bots')
      debug('The current bot is')
      debug(req.session.currentBot)
      debug('All of the account bots are')
      debug(req.session.bots)
    }
  }
  res.render('dashboard', {
    menus: app.locals.menu,
    currentBot: req.session.currentBot,
    anyBots: anyBots
  })
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
