/*global Parse */
var app = global.app
var _ = require('underscore')

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
  req.logout()
  res.redirect('/')
})

app.get('/portal', function (req, res) {
  res.render('dashboard', {
    menus: app.locals.menu,
    current_room: req.session.currentBot.name,
    networkAddresses: req.session.currentBot.addresses
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
