app = global.app
debug = require('debug')('library')
ObjectID = require('mongodb').ObjectID

exports.library = (req, res) ->
  Scripts = app.locals.dbClient.collection('Scripts')
  Scripts.find().toArray().then (scripts) ->
    debug 'I found scripts!'
    debug scripts
    res.render 'library', scripts: scripts
    return
  return

exports.script = (req, res) ->
  Scripts = app.locals.dbClient.collection('Scripts')
  objectId = new ObjectID(req.params.id)
  Scripts.find(_id: objectId).next().then((script) ->
    debug 'Found the script'
    debug script
    if script
      res.render 'script', script: script
    else
      debug 'I did not find a script with id ' + req.params.id
      res.redirect 'back'
    return
  ).catch (err) ->
    debug 'Caught error in script'
    debug err
    return
  return

exports.new = (req, res) ->
  Scripts = app.locals.dbClient.collection('Scripts')
  Bots = app.locals.dbClient.collection('Bots')
  objectId = new ObjectID(req.params.id)
  Scripts.find(_id: objectId).next().then((script) ->
    debug 'Found the script'
    debug script
    script._id = new ObjectID
    script.accountId = req.user._id
    script.settings = script.default_settings
    delete script.default_settings
    script.ownerHandles = []
    script.notificationEmails = ''
    script.notificationEmailSubject = 'Conversation Complete'
    debug 'Makking a new bot'
    debug script
    Bots.insert script
    req.session.currentBot = script
    debug 'Current bot'
    debug req.session.currentBot
    return
  ).then((response) ->
    Bots.find(accountId: req.user._id).toArray()
  ).then((bots) ->
    debug 'After creating bot...'
    debug 'The bots in the database'
    debug bots
    req.session.bots = bots
    res.redirect '/portal/conversations'
    return
  ).catch (err) ->
    debug 'Caught error in script'
    debug err
    return
  return

app.get '/portal/script/new/:id', exports.new
app.get '/portal/script/:id', exports.script
app.get '/portal/library', exports.library
