###global Parse ###

app = global.app
_ = require('underscore')

exports.networks = (req, res) ->
  currentUser = req.user()
  Integrations = Parse.Object.extend('Integrations')
  query = new (Parse.Query)(Integrations)
  integrations = undefined
  currentNetworkId = undefined
  query.equalTo 'type', 'network'
  query.equalTo 'user', currentUser
  network_info = []
  query.find().then((results) ->
    `var query`
    integrations = results
    Networks = Parse.Object.extend('Networks')
    query = new (Parse.Query)(Networks)
    query.find()
  ).then ((networks) ->
    if integrations.length == 1
      currentNetworkId = integrations[0].get('externalId')
    else
      defaultNetwork = _.find(networks, (network) ->
        console.log network.get('name')
        network.get('default') == true
      )
      currentNetworkId = defaultNetwork.id
    _.each networks, (element, index, list) ->
      info = 
        name: element.get('name')
        id: element.id
        current: element.id == currentNetworkId
      network_info.push info
      return
    res.render 'networks', networks: network_info
    return
  ), (error) ->
    console.log 'Failed to fetch networks'
    console.log error
    return
  return

exports.network_update = (req, res) ->
  currentUser = req.user()
  Integrations = Parse.Object.extend('Integrations')
  query = new (Parse.Query)(Integrations)
  query.equalTo 'type', 'network'
  query.equalTo 'user', currentUser
  query.find().then((integrations) ->
    promises = []
    _.each integrations, (integration) ->
      promises.push integration.destroy()
      return
    # Return a new promise that is resolved when all of the deletes are finished.
    Parse.Promise.when promises
  ).then(->
    `var query`
    Networks = Parse.Object.extend('Networks')
    query = new (Parse.Query)(Networks)
    query.equalTo 'name', req.body.network_name
    query.find()
  ).then((networks) ->
    `var Integrations`
    existing_network = networks.shift()
    Integrations = Parse.Object.extend('Integrations')
    new_network = new Integrations
    Rooms = Parse.Object.extend('Rooms')
    room = new Rooms
    room.id = req.cookies.roomId
    new_network.set 'room', room
    new_network.set 'user', currentUser
    new_network.set 'provider', req.body.network_name
    new_network.set 'type', 'network'
    auth = 
      'type': 'REST'
      'credentials':
        api_key: req.body.api_key
        api_secret: req.body.api_secret
    new_network.set 'auth', auth
    new_network.set 'externalId', existing_network.id
    new_network.save()
  ).then ((network) ->
    res.redirect 'portal/settings'
    return
  ), (error) ->
    console.log 'Failed to fetch networks'
    console.log error
    return
  return

exports.add_number = (req, res) ->
  currentUser = req.user()
  Integrations = Parse.Object.extend('Integrations')
  query = new (Parse.Query)(Integrations)
  auth = undefined
  query.equalTo 'type', 'network'
  query.equalTo 'user', currentUser
  query.find().then((integrations) ->
    # If there aren't any integrations, assume we are on the home
    # network, TSG
    activeNetwork = undefined
    integration = undefined
    console.log integrations
    if integrations.length == 0
      activeNetwork = 'tsg'
    else
      integration = integrations.shift()
      console.log integration
      activeNetwork = integration.get('provider')
      auth = integration.get('auth')
      console.log activeNetwork
      console.log auth
    # Now get some numbers to add.
    switch activeNetwork
      when 'nexmo'
        return Parse.Cloud.httpRequest(
          url: 'https://rest.nexmo.com/number/search'
          params:
            api_key: auth.credentials.api_key
            api_secret: auth.credentials.api_secret
            country: 'US')
      else
        console.log 'No active network. Bad. Bad. Bad.'
        break
    return
  ).then ((httpResponse) ->
    console.log httpResponse.text
    return
  ), (httpResponse) ->
    console.error 'Request failed with response code ' + httpResponse.status
    return
  return

app.get '/portal/config/networks', exports.networks
app.post '/portal/config/network_update', exports.network_update
app.get '/portal/config/add_number', exports.add_number
