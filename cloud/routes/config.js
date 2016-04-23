var app = global.app
var _ = require('underscore')
var debug = require('debug')('config')

exports.info = function (req, res) {
  var keywords = _.reduce(
    req.session.currentBot.addresses,
    function (memo, address) {
      return memo + address.networkHandleName + ','
    },
    ''
  )
  res.render('info', {
    user: req.user,
    bot: req.session.currentBot,
    keywords: keywords
  })
}

exports.bots = function (req, res) {
  res.render('bots', {
    user: req.user,
    bots: req.session.bots
  })
}

exports.changeBot = function (req, res) {
  req.session.currentBot = _.findWhere(req.session.bots, { _id: req.query.id })
  res.redirect('/portal')
}

exports.settings = function (req, res) {
  var cookies = req.cookies
  res.render('settings', {
    name: cookies.roomName,
    keywords: cookies.keywords,
    keyword: cookies.selectedKeyword
  })
}

exports.list = function (req, res) {
  var display_settings = []
  _.each(req.session.currentBot.settings, function (element, index, list) {
    display_settings.push({
      key: element.name,
      v: element.value
    })
  })
  res.render('config', {
    config: display_settings
  })
}

exports.edit = function (req, res) {
  var display_settings = []
  _.each(req.session.currentBot.settings, function (element, index, list) {
    display_settings.push({
      key: element.name,
      v: element.value
    })
  })
  res.render('config_edit', {
    config: display_settings
  })
}

exports.save = function (req, res) {
  _.each(req.body, function (elem, index, list) {
    // For each of the parameters in req.body, update the setting
    var setting = _.findWhere(req.session.currentBot.settings, {name: index})
    setting.value = elem
  })
  var Bots = app.locals.dbClient.collection('Bots')
  Bots.updateOne(
    {'_id': req.session.currentBot._id},
    {$set: { settings: req.session.currentBot.settings }}
  ).then(function (result) {
    res.redirect('/portal/config')
  })
}

exports.owners = function (req, res) {
  res.render('owners', {
    owners: req.session.currentBot.ownerHandles
  })
}

exports.ownerDelete = function (req, res) {
  req.session.currentBot.ownerHandles =
    _.without(req.session.currentBot.ownerHandles, req.query.number)
  var Bots = app.locals.dbClient.collection('Bots')
  Bots.update(
    {'_id': req.session.currentBot._id},
    {$set: {ownerHandles: req.session.currentBot.ownerHandles}})
  res.render('owners', {
    owners: req.session.currentBot.ownerHandles
  })
}

exports.ownerAdd = function (req, res) {
  var owner_number = req.body.new_owner.replace(/\D/g, '')
  req.session.currentBot.ownerHandles.push(owner_number)
  var Bots = app.locals.dbClient.collection('Bots')
  Bots.update(
    {'_id': req.session.currentBot._id},
    {$set: {ownerHandles: req.session.currentBot.ownerHandles}})
  res.render('owners', {
    owners: req.session.currentBot.ownerHandles
  })
}

exports.notificationEmails = function (req, res) {
  // Convert the comma seperated string into an array
  res.render('notification_emails', {
    notificationEmails: req.session.currentBot.notificationEmails.split(','),
    mail_user: req.session.currentBot.mail_user,
    mail_pass: req.session.currentBot.mail_pass,
    webhook: req.session.currentBot.webhook
  })
}

exports.notificationEmailDelete = function (req, res) {
  var notificationEmails = req.session.currentBot.notificationEmails.split(',')
  req.session.currentBot.notificationEmails =
    _.without(notificationEmails, req.query.email).join(',')
  var Bots = app.locals.dbClient.collection('Bots')
  Bots.update(
    {'_id': req.session.currentBot._id},
    {$set: {notificationEmails: req.session.currentBot.notificationEmails}})
  res.render('notification_emails', {
    notificationEmails: req.session.currentBot.notificationEmails.split(','),
    mail_user: req.session.currentBot.mail_user,
    mail_pass: req.session.currentBot.mail_pass,
    webhook: req.session.currentBot.webhook
  })
}

exports.notificationEmailAdd = function (req, res) {
  req.session.currentBot.notificationEmails += ',' + req.body.email
  var Bots = app.locals.dbClient.collection('Bots')
  Bots.update(
    {'_id': req.session.currentBot._id},
    {$set: {notificationEmails: req.session.currentBot.notificationEmails}})
  res.render('notification_emails', {
    notificationEmails: req.session.currentBot.notificationEmails.split(','),
    mail_user: req.session.currentBot.mail_user,
    mail_pass: req.session.currentBot.mail_pass,
    webhook: req.session.currentBot.webhook
  })
}

exports.notificationCredsUpdate = function (req, res) {
  req.session.currentBot.mail_user = req.body.mail_user
  req.session.currentBot.mail_pass = req.body.mail_pass
  req.session.currentBot.webhook = req.body.webhook
  var Bots = app.locals.dbClient.collection('Bots')
  Bots.update(
    {'_id': req.session.currentBot._id},
    { $set: {
      mail_user: req.body.mail_user,
      mail_pass: req.body.mail_pass,
      webhook: req.body.webhook
    }})
  res.render('notification_emails', {
    notificationEmails: req.session.currentBot.notificationEmails.split(','),
    mail_user: req.session.currentBot.mail_user,
    mail_pass: req.session.currentBot.mail_pass,
    webhook: req.session.currentBot.webhook
  })
}

exports.newBot = function (req, res) {
  res.render('new_bot')
}

exports.type = function (req, res) {
  var Scripts = app.locals.dbClient.collection('Scripts')
  Scripts.find().toArray()
  .then(function (scripts) {
    res.render('types', {
      scripts: scripts,
      currentBot: req.session.currentBot
    })
  })
  .catch(function (err) {
    console.log('Function error')
    console.log(err)
  })
}

exports.typeChange = function (req, res) {
  var Scripts = app.locals.dbClient.collection('Scripts')
  Scripts.find().toArray()
  .then(function (scripts) {
    var newScript = _.findWhere(req.session.bots, {_id: req.params.id})
    req.session.currentBot.scriptId = req.params.id
    req.session.currentBot.settings = newScript.default_settings
    req.session.currentBot.description = newScript.desc
    req.session.currentBot.name = newScript.name
    var Bots = app.locals.dbClient.collection('Bots')
    Bots.update(
      {'_id': req.session.currentBot._id},
      req.session.currentBot)
    return res.redirect('/portal/settings/')
  })
  .catch(function (err) {
    debug('Type change error')
    debug(err)
  })
}

app.get('/portal/config/owners', exports.owners)
app.get('/portal/config/ownerDelete', exports.ownerDelete)
app.post('/portal/config/ownerAdd', exports.ownerAdd)
app.get('/portal/config/notification_emails', exports.notificationEmails)
app.get('/portal/config/notification_email_delete', exports.notificationEmailDelete)
app.post('/portal/config/notificationEmailAdd', exports.notificationEmailAdd)
app.post('/portal/config/notificationCredsUpdate', exports.notificationCredsUpdate)
app.get('/portal/config/type', exports.type)
app.get('/portal/config/info', exports.info)
app.get('/portal/config', exports.list)
app.get('/portal/config/edit', exports.edit)
app.post('/portal/config/save', exports.save)
app.get('/portal/settings', exports.settings)
app.get('/portal/config/bots', exports.bots)
app.get('/portal/config/change_bot', exports.changeBot)
app.get('/portal/config/typeChange/:id', exports.typeChange)
