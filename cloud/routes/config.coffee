app = global.app
_ = require('underscore')
debug = require('debug')('config')
ObjectID = require('mongodb').ObjectID

exports.info = (req, res) ->
  keywords = _.reduce(req.session.currentBot.addresses, ((memo, address) ->
    memo + address.networkHandleName + ','
  ), '')
  res.render 'info',
    user: req.user
    bot: req.session.currentBot
    keywords: keywords
  return

exports.bots = (req, res) ->
  res.render 'bots',
    user: req.user
    bots: req.session.bots
  return

exports.changeBot = (req, res) ->
  req.session.currentBot = _.findWhere(req.session.bots, _id: req.query.id)
  res.redirect '/portal/conversations'
  return

exports.settings = (req, res) ->
  debug 'Showing settings for'
  debug req.session
  res.render 'settings', bot: req.session.currentBot
  return

exports.list = (req, res) ->
  display_settings = []
  _.each req.session.currentBot.settings, (element, index, list) ->
    display_settings.push
      key: element.name
      v: element.value
    return
  res.render 'config', config: display_settings
  return

exports.edit = (req, res) ->
  display_settings = []
  _.each req.session.currentBot.settings, (element, index, list) ->
    display_settings.push
      key: element.name
      v: element.value
    return
  res.render 'config_edit', config: display_settings
  return

exports.save = (req, res) ->
  _.each req.body, (elem, index, list) ->
    # For each of the parameters in req.body, update the setting
    setting = _.findWhere(req.session.currentBot.settings, name: index)
    setting.value = elem
    return
  Bots = app.locals.dbClient.collection('Bots')
  Bots.updateOne({ '_id': req.session.currentBot._id },
    $set: settings: req.session.currentBot.settings
  ).then (result) ->
    res.redirect '/portal/config'
    return
  return

exports.owners = (req, res) ->
  res.render 'owners', owners: req.session.currentBot.ownerHandles
  return

exports.ownerDelete = (req, res) ->
  req.session.currentBot.ownerHandles =
    _.without(req.session.currentBot.ownerHandles, req.query.number)
  Bots = app.locals.dbClient.collection('Bots')
  Bots.update { '_id': req.session.currentBot._id },
    $set: ownerHandles: req.session.currentBot.ownerHandles
  res.render 'owners', owners: req.session.currentBot.ownerHandles
  return

exports.ownerAdd = (req, res) ->
  owner_number = req.body.new_owner.replace(/\D/g, '')
  req.session.currentBot.ownerHandles.push owner_number
  Bots = app.locals.dbClient.collection('Bots')
  Bots.update { '_id': req.session.currentBot._id },
    $set: ownerHandles: req.session.currentBot.ownerHandles
  res.render 'owners', owners: req.session.currentBot.ownerHandles
  return

exports.keywords = (req, res) ->
  debug 'Showing keywords for ====> '
  debug req.session.currentBot
  res.render 'keywords', keywords: keywords(req.session.currentBot.addresses)
  return

exports.keywordAdd = (req, res) ->
  debug 'Adding new keyword of'
  debug req.body
  for address in req.session.currentBot.addresses
    debug 'Adding keyword to '
    debug address
    address.keywords.push req.body.newKeyword
  Bots = app.locals.dbClient.collection('Bots')
  Bots.update { '_id': req.session.currentBot._id },
    $set: addresses: req.session.currentBot.addresses
  res.redirect '/portal/config/keywords'
  return

exports.notificationEmails = (req, res) ->
  # Convert the comma seperated string into an array
  res.render 'notification_emails',
    notificationEmails: req.session.currentBot.notificationEmails.split(',')
    mail_user: req.session.currentBot.mail_user
    mail_pass: req.session.currentBot.mail_pass
    webhook: req.session.currentBot.webhook
  return

exports.notificationEmailDelete = (req, res) ->
  notificationEmails = req.session.currentBot.notificationEmails.split(',')
  req.session.currentBot.notificationEmails = _.without(notificationEmails, req.query.email).join(',')
  Bots = app.locals.dbClient.collection('Bots')
  Bots.update { '_id': req.session.currentBot._id }, $set: notificationEmails: req.session.currentBot.notificationEmails
  res.render 'notification_emails',
    notificationEmails: req.session.currentBot.notificationEmails.split(',')
    mail_user: req.session.currentBot.mail_user
    mail_pass: req.session.currentBot.mail_pass
    webhook: req.session.currentBot.webhook
  return

exports.notificationEmailAdd = (req, res) ->
  req.session.currentBot.notificationEmails += ',' + req.body.email
  Bots = app.locals.dbClient.collection('Bots')
  Bots.update { '_id': req.session.currentBot._id },
    $set: notificationEmails: req.session.currentBot.notificationEmails
  res.render 'notification_emails',
    notificationEmails: req.session.currentBot.notificationEmails.split(',')
    mail_user: req.session.currentBot.mail_user
    mail_pass: req.session.currentBot.mail_pass
    webhook: req.session.currentBot.webhook
  return

exports.creds_update = (req, res) ->
  req.session.currentBot.mail_user = req.body.mail_user
  req.session.currentBot.mail_pass = req.body.mail_pass
  req.session.currentBot.webhook = req.body.webhook
  Bots = app.locals.dbClient.collection('Bots')
  Bots.update { '_id': req.session.currentBot._id }, $set:
    mail_user: req.body.mail_user
    mail_pass: req.body.mail_pass
    webhook: req.body.webhook
  res.render 'notification_emails',
    notificationEmails: req.session.currentBot.notificationEmails.split(',')
    mail_user: req.session.currentBot.mail_user
    mail_pass: req.session.currentBot.mail_pass
    webhook: req.session.currentBot.webhook
  return

exports.newBot = (req, res) ->
  res.render 'new_bot'
  return

exports.type = (req, res) ->
  Scripts = app.locals.dbClient.collection('Scripts')
  Scripts.find().toArray().then((scripts) ->
    res.render 'types',
      scripts: scripts
      currentBot: req.session.currentBot
    return
  ).catch (err) ->
    console.log 'Function error'
    console.log err
    return
  return

exports.typeChange = (req, res) ->
  objectId = new ObjectID(req.params.id)
  botId = req.session.currentBot._id
  debug 'Changing type to ID ' + req.params.id
  Scripts = app.locals.dbClient.collection('Scripts')
  Scripts.find(_id: objectId).next().then((newScript) ->
    debug 'Look at what I found'
    debug newScript
    req.session.currentBot.scriptId = req.params.id
    req.session.currentBot.settings = newScript.default_settings
    req.session.currentBot.description = newScript.desc
    req.session.currentBot.name = newScript.name
    Bots = app.locals.dbClient.collection('Bots')
    Bots.update { '_id': botId }, req.session.currentBot
    res.redirect '/portal/settings/' + botId
  ).catch (err) ->
    debug 'Type change error'
    debug err
    return
  return

app.get '/portal/config/owners', exports.owners
app.get '/portal/config/ownerDelete', exports.ownerDelete
app.post '/portal/config/ownerAdd', exports.ownerAdd
app.get '/portal/config/notification_emails', exports.notificationEmails
app.get '/portal/config/email_delete', exports.notificationEmailDelete
app.post '/portal/config/notificationEmailAdd', exports.notificationEmailAdd
app.post '/portal/config/creds_update', exports.creds_update
app.get '/portal/config/type', exports.type
app.get '/portal/config/info', exports.info
app.get '/portal/config', exports.list
app.get '/portal/config/edit', exports.edit
app.post '/portal/config/save', exports.save
app.get '/portal/settings', exports.settings
app.get '/portal/config/bots', exports.bots
app.get '/portal/config/change_bot', exports.changeBot
app.get '/portal/config/typeChange/:id', exports.typeChange
app.get '/portal/config/keywords', exports.keywords
app.post '/portal/config/keywordAdd', exports.keywordAdd
