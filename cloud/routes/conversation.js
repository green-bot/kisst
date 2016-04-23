/*global Parse */
var app = global.app
var _ = require('underscore')
var debug = require('debug')('conversation')

exports.download_csv = function (req, res) {
  var Sessions = Parse.Object.extend('Sessions')
  var query = new Parse.Query(Sessions)
  var Rooms = Parse.Object.extend('Rooms')
  var room = new Rooms()
  room.id = req.cookies.roomId
  query.equalTo('room', room)
  query.find().then(function (usersData) {
    // We have to figure out the headers for the CSV, which includes
    // not only the standard fields, but also the fields that are
    // embedded in collected_data.
    var conversations = []
    var keys = []
    _.each(usersData, function assemble (element, index, list) {
      var record = {}
      var parsedData = JSON.parse(element.get('collected_data'))
      console.log('This row has collected data ' + JSON.stringify(parsedData))
      console.log('This row has properties' + JSON.stringify(Object.keys(element)))
      record.src = element.get('src')
      record.dst = req.cookies.roomName
      record.session_id = element.get('sessionId')
      record.conversation_start = element.createdAt.toISOString()
      record.conversation_end = element.updatedAt.toISOString()
      _.each(Object.keys(parsedData), function extract (element, index, list) {
        var new_key_name = 'data_' + element
        record[new_key_name] = parsedData[element]
      })
      var originalTranscript = JSON.parse(element.get('transcript'))
      var transcript = ''
      _.each(originalTranscript, function (element, index, list) {
        transcript += element['direction'] + ':' + element['text'] + '|'
      })
      record.transcript = transcript
      conversations.push(record)
      keys.push(Object.keys(record))
      console.log('Added the following keys' + JSON.stringify(Object.keys(record)))
    })
    // keys has many duplicates, needs flattening
    keys = _.flatten(keys)
    keys = _.uniq(keys)

    console.log('Found the following keys' + JSON.stringify(keys))

    // Now that it's collected and expanded, create the CSV
    var csv = ''

    _.each(keys, function add_headers (element, index, list) {
      csv += element + ','
    })
    // Erase that last comma for the header
    csv = csv.slice(0, -1) + '\n'

    _.each(conversations, function assemble_csv (row, index, list) {
      _.each(keys, function add_col (key, index, list) {
        csv += row[key] + ','
      })
      csv = csv.slice(0, -1) + '\n'
    })
    res.set({
      'Content-Disposition': 'attachment; filename=conversations.csv',
      'Content-type': 'text/csv'
    })
    res.send(csv)
  }, function (error) {
    console.log('Failed to get conversations.')
    console.log(error)
      // Not good.
  })
}

exports.list = function (req, res) {
  var Sessions = app.locals.dbClient.collection('Sessions')
  var mySessions = Sessions.find({botId: req.session.currentBot._id})
  var date_options = {
    weekday: 'short',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/New_York'
  }
  var mappedSessions = mySessions.map(function (session) {
    var record = {}
    record.src = session.src
    record.dst = session.dst
    record.session_id = session.sessionId
    record.ts = session.createdAt.toDateString('en-US', date_options)
    record.objectId = session._id
    return record
  })
  mappedSessions.toArray().then(function (sessions) {
    res.render('conversations', {
      conversations: sessions
    })
  })
}

exports.read = function (req, res) {
  debug('Reading conversation')
  var Sessions = app.locals.dbClient.collection('Sessions')
  Sessions.find({_id: req.params.id}).limit(1).next()
  .then(function (session) {
    debug('Its a ')
    debug(session)
    var display_data = []
    var data_labels = _.keys(session.collected_data)
    _.each(data_labels, function convertForDisplay (element, index, list) {
      var entry = {
        key: element,
        v: session.collected_data[element]
      }
      debug(entry)
      display_data.push(entry)
    })
    var myDate = new Date(session.createdAt)
    var options = {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    var display_timestamp = myDate.toLocaleTimeString('en-us', options)
    var display_transcript = []
    _.each(session.transcript, function (element, index, list) {
      display_transcript.push(
        {
          source: element.direction === 'ingress' ? session.src : session.dst,
          text: element.text
        })
    })
    res.render('conversation', {
      session_id: req.params.id,
      transcript: display_transcript,
      collected_data: display_data,
      src: session.src,
      dst: session.dst,
      timestamp: display_timestamp
    })
  })
  .catch(function (err) {
    debug(err)
  })
}
app.get('/portal/conversations', exports.list)
app.get('/portal/conversations/download', exports.download_csv)
app.get('/portal/conversations/:id', exports.read)
