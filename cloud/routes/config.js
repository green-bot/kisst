/*global Parse */

var app = global.app
var _ = require('underscore')
var debug = require('debug')('config')

exports.info = function (req, res) {
  console.log('My session')
  console.log(req.session)
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
  debug('Saving')
  debug(req.body)
  debug(req.session.currentBot.settings)
  _.each(req.body, function (elem, index, list) {
    debug('Checking')
    debug(index)
    debug(elem)
    // For each of the parameters in req.body, update the setting
    var setting = _.findWhere(req.session.currentBot.settings, {name: index})
    setting.value = elem
  })
  debug('the current bot settings:', req.session.currentBot.settings)
  var Bots = app.locals.dbClient.collection('Bots')
  Bots.updateOne(
    {'_id': req.session.currentBot._id},
    {$set: { settings: req.session.currentBot.settings }}
  ).then(function (result) {
    res.redirect('/portal/config')
  })
}

exports.reset_request = function (req, res) {
  var username = req.body.email.trim()
    .toLowerCase()
  console.log('Resetting the password for ' + username)
  Parse.User.requestPasswordReset(username, {
    success: function () {
      // Password reset request was sent successfully
      console.log('Found it.')
      res.redirect('/portal')
    },
    error: function (error) {
      console.log('I didnt find that user.')
      console.log(error)
        // Password reset request was sent successfully
      res.render('reset_page', {
        error: error.message
      })
    }
  })
}

exports.owners = function (req, res) {
  res.render('owners', {
    owners: req.session.currentBot.ownerHandles
  })
}

exports.owner_delete = function (req, res) {
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

exports.owner_add = function (req, res) {
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

exports.notification_email_add = function (req, res) {
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

exports.notification_creds_update = function (req, res) {
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

exports.type_change = function (req, res) {
  var Rooms = Parse.Object.extend('Rooms')
  var query = new Parse.Query(Rooms)
  var room
  query.get(req.cookies.roomId)
    .then(function (foundRoom) {
      room = foundRoom
      var Script = Parse.Object.extend('Scripts')
      var query = new Parse.Query(Script)
      return query.get(req.params.id)
    })
    .then(function (script) {
      var default_cmd = script.get('default_cmd')
      var settings = script.get('default_settings')
      var owner_cmd = script.get('owner_cmd')
      var default_path = script.get('default_path')
      return room.save({
        default_cmd: default_cmd,
        settings: settings,
        owner_cmd: owner_cmd,
        default_path: default_path
      })
    })
    .then(function (room) {
      console.log('New room...')
      console.log(room)
      return res.redirect('/portal/settings/')
    }, function (error) {
      console.log('Fail.')
      console.log(error)
    })
}

exports.networks = function (req, res) {
  var currentUser = req.user()
  var Integrations = Parse.Object.extend('Integrations')
  var query = new Parse.Query(Integrations)
  var integrations
  var currentNetworkId
  query.equalTo('type', 'network')
  query.equalTo('user', currentUser)
  var network_info = []
  query.find()
    .then(
      function (results) {
        integrations = results
        var Networks = Parse.Object.extend('Networks')
        var query = new Parse.Query(Networks)
        return query.find()
      })
    .then(function (networks) {
      if (integrations.length === 1) {
        currentNetworkId = integrations[0].get('externalId')
      } else {
        var defaultNetwork = _.find(networks, function (network) {
          console.log(network.get('name'))
          return network.get('default') === true
        })
        currentNetworkId = defaultNetwork.id
      }
      _.each(networks, function (element, index, list) {
        var info = {
          name: element.get('name'),
          id: element.id,
          current: element.id === currentNetworkId
        }
        network_info.push(info)
      })
      res.render('networks', {
        networks: network_info
      })
    }, function (error) {
      console.log('Failed to fetch networks')
      console.log(error)
    })
}
exports.network_update = function (req, res) {
  var currentUser = req.user()
  var Integrations = Parse.Object.extend('Integrations')
  var query = new Parse.Query(Integrations)
  query.equalTo('type', 'network')
  query.equalTo('user', currentUser)
  query.find().then(
    function (integrations) {
      var promises = []
      _.each(integrations, function (integration) {
        promises.push(integration.destroy())
      })
      // Return a new promise that is resolved when all of the deletes are finished.
      return Parse.Promise.when(promises)
    }).then(function () {
      var Networks = Parse.Object.extend('Networks')
      var query = new Parse.Query(Networks)
      query.equalTo('name', req.body.network_name)
      return query.find()
    }).then(function (networks) {
      var existing_network = networks.shift()
      var Integrations = Parse.Object.extend('Integrations')
      var new_network = new Integrations()
      var Rooms = Parse.Object.extend('Rooms')
      var room = new Rooms()
      room.id = req.cookies.roomId
      new_network.set('room', room)
      new_network.set('user', currentUser)
      new_network.set('provider', req.body.network_name)
      new_network.set('type', 'network')
      var auth = {
        'type': 'REST',
        'credentials': {
          api_key: req.body.api_key,
          api_secret: req.body.api_secret
        }
      }
      new_network.set('auth', auth)
      new_network.set('externalId', existing_network.id)
      return new_network.save()
    }).then(function (network) {
      res.redirect('portal/settings')
    }, function (error) {
      console.log('Failed to fetch networks')
      console.log(error)
    })
}
app.get('/portal/config/owners', exports.owners)
app.get('/portal/config/owner_delete', exports.owner_delete)
app.post('/portal/config/owner_add', exports.owner_add)
app.get('/portal/config/notification_emails', exports.notificationEmails)
app.get('/portal/config/notification_email_delete', exports.notificationEmailDelete)
app.post('/portal/config/notification_email_add', exports.notification_email_add)
app.post('/portal/config/notification_creds_update', exports.notification_creds_update)
app.get('/portal/config/type', exports.type)
app.get('/portal/config/info', exports.info)
app.get('/portal/config', exports.list)
app.get('/portal/config/edit', exports.edit)
app.post('/portal/config/save', exports.save)
app.post('/reset_request', exports.reset_request)
app.get('/portal/settings', exports.settings)
app.get('/portal/config/bots', exports.bots)
app.get('/portal/config/change_bot', exports.changeBot)
app.get('/portal/config/type_change/:id', exports.type_change)
