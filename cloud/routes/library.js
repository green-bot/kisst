var app = global.app
var debug = require('debug')('library')
var ObjectID = require('mongodb').ObjectID

exports.library = function (req, res) {
  var Scripts = app.locals.dbClient.collection('Scripts')
  Scripts.find().toArray()
  .then(function (scripts) {
    debug('I found scripts!')
    debug(scripts)
    res.render('library', {
      scripts: scripts
    })
  })
}

exports.script = function (req, res) {
  var Scripts = app.locals.dbClient.collection('Scripts')
  var objectId = new ObjectID(req.params.id)
  Scripts.find({_id: objectId}).next()
  .then(function (script) {
    debug('Found the script')
    debug(script)
    if (script) {
      res.render('script', {
        script: script
      })
    } else {
      debug('I did not find a script with id ' + req.params.id)
      res.redirect('back')
    }
  })
  .catch(function (err) {
    debug('Caught error in script')
    debug(err)
  })
}

exports.new = function (req, res) {
  var Scripts = app.locals.dbClient.collection('Scripts')
  var Bots = app.locals.dbClient.collection('Bots')
  var objectId = new ObjectID(req.params.id)
  Scripts.find({_id: objectId}).next()
  .then(function (script) {
    debug('Found the script')
    debug(script)
    script._id = new ObjectID()
    script.accountId = req.user._id
    script.settings = script.default_settings
    delete script.default_settings
    script.ownerHandles = []
    script.notificationEmails = ''
    script.notificationEmailSubject = 'Conversation Complete'
    debug('Makking a new bot')
    debug(script)
    Bots.insert(script)
    req.session.currentBot = script
    debug('Current bot')
    debug(req.session.currentBot)
  })
  .then(function (response) {
    return Bots.find({accountId: req.user._id}).toArray()
  })
  .then(function (bots) {
    debug('After creating bot...')
    debug('The bots in the database')
    debug(bots)
    req.session.bots = bots
    res.redirect('/portal/conversations')
  })
  .catch(function (err) {
    debug('Caught error in script')
    debug(err)
  })
}

app.get('/portal/script/new/:id', exports.new)
app.get('/portal/script/:id', exports.script)
app.get('/portal/library', exports.library)
