app = global.app
_ = require('underscore')
debug = require('debug')('conversation')

exports.download_csv = (req, res) ->
  Sessions = app.locals.dbClient.collection('Sessions')
  mySessions = Sessions.find(botId: req.session.currentBot._id)
  mySessions.toArray().then((sessions) ->
    # We have to figure out the headers for the CSV, which includes
    # not only the standard fields, but also the fields that are
    # embedded in collectedData.
    conversations = []
    keys = []
    _.each sessions, (session, index, list) ->
      record = {}
      debug 'Managing session'
      debug session
      debug 'This row has collected data '
      debug session.collectedData
      debug 'This row has properties'
      debug Object.keys(session)
      record.src = session.src
      record.dst = session.dst
      record.session_id = session.sessionId
      record.conversation_start = session.createdAt.toISOString()
      record.conversation_end = session.updatedAt.toISOString()
      _.each Object.keys(session.collectedData), (property, index, list) ->
        new_key_name = 'data_' + property
        record[new_key_name] = session.collectedData[property]
        return
      originalTranscript = session.transcript
      transcript = ''
      _.each originalTranscript, (line, index, list) ->
        transcript += line['direction'] + ':' + line['text'] + '|'
        return
      record.transcript = transcript
      conversations.push record
      keys.push Object.keys(record)
      debug 'Added the following keys'
      debug JSON.stringify(Object.keys(record))
      return
    # keys has many duplicates, needs flattening
    keys = _.flatten(keys)
    keys = _.uniq(keys)
    debug 'Found the following keys'
    debug keys
    # Now that it's collected and expanded, create the CSV
    csv = ''
    _.each keys, (header, index, list) ->
      csv += header + ','
      return
    # Erase that last comma for the header
    csv = csv.slice(0, -1) + '\n'
    debug 'CSV Header'
    debug csv
    _.each conversations, (row, index, list) ->
      debug 'Adding '
      _.each keys, (key, index, list) ->
        csv += row[key] + ','
        return
      csv = csv.slice(0, -1) + '\n'
      return
    res.set
      'Content-Disposition': 'attachment; filename=conversations.csv'
      'Content-type': 'text/csv'
    res.send csv
    return
  ).catch (err) ->
    debug err
    return
  return

exports.list = (req, res) ->
  debug 'Listing conversations'
  debug req.session.passport.user
  Sessions = app.locals.dbClient.collection('Sessions')
  Sessions.find({botId: req.session.passport.user}).toArray()
  .then (sessions) ->
    debug 'I found the sessions:'
    debug sessions

    date_options =
      weekday: 'short'
      year: '2-digit'
      month: '2-digit'
      day: '2-digit'
      timeZone: 'America/New_York'
    mappedSessions = sessions.map (session) ->
      record = {}
      record.src = session.src
      record.dst = session.dst
      record.session_id = session.sessionId
      record.ts = session.createdAt.toDateString('en-US', date_options)
      record.objectId = session._id
      record
    res.render 'conversations', conversations: mappedSessions

exports.read = (req, res) ->
  debug 'Reading conversation for session id'
  debug req.params

  Sessions = app.locals.dbClient.collection('Sessions')
  Sessions.find(_id: req.params.id).limit(1).next().then((session) ->
    debug 'Its a '
    debug session
    display_data = []
    data_labels = _.keys(session.collected_data)
    _.each data_labels, (element, index, list) ->
      entry =
        key: element
        v: session.collected_data[element]
      debug entry
      display_data.push entry
      return
    myDate = new Date(session.createdAt)
    options =
      weekday: 'long'
      year: 'numeric'
      month: 'short'
      day: 'numeric'
      hour: '2-digit'
      minute: '2-digit'
    display_timestamp = myDate.toLocaleTimeString('en-us', options)
    display_transcript = []
    _.each session.transcript, (element, index, list) ->
      display_transcript.push
        source: if element.direction == 'ingress' then session.src else session.dst
        text: element.text
      return
    res.render 'conversation',
      session_id: req.params.id
      transcript: display_transcript
      collected_data: display_data
      src: session.src
      dst: session.dst
      timestamp: display_timestamp
    return
  ).catch (err) ->
    debug err
    return
  return

app.get '/portal/conversations', exports.list
app.get '/portal/conversations/download', exports.download_csv
app.get '/portal/conversations/:id', exports.read
