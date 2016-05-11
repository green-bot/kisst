# Copyright (c) 2016, GreenBot
express = require('express')
bodyParser = require('body-parser')
cookieParser = require('cookie-parser')
serveStatic = require('serve-static')
MongoClient = require('mongodb').MongoClient
assert = require('assert')
session = require('express-session')
flash = require('connect-flash')
RedisStore = require('connect-redis')(session)
app = express()
global.app = app
# Start the express application and make it global
app.set 'view engine', 'pug'
app.set 'views', process.cwd() + '/cloud/views/'
# Specify the folder to find templates
app.use serveStatic('public')
app.use cookieParser()
app.use session(
  secret: 'nantucket sleigh ride'
  resave: false
  saveUninitialized: true
  store: new RedisStore(url: 'redis://127.0.0.1:6379/0'))
app.use bodyParser.urlencoded(extended: true)
app.use flash()
require './cloud/routes/session'
require './cloud/routes'
# Connection URL
url = 'mongodb://localhost:27017/greenbot'
MongoClient.connect url, (err, db) ->
  assert !err
  app.locals.dbClient = db
  # require('express-trace')(app)
  app.listen 3004
  return
