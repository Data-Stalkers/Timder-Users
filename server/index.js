const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const db = require('../database/index.js');
const fs = require('fs');
const configs = require('../config/config.js');
const app = express();

// ==== CONFIGS ====
const ERROR_LOG_PATH = './logs/serverLog.txt';
const port = 3000;
let d;
// AWS.config.update({accessKeyId: 'KEY', secretAccessKey: 'SECRET'});
AWS.config.update({
  region: 'us-west-1',
  accessKeyId: configs.timderAccess,
  secretAccessKey: configs.timderSecret
});

var sqs = new AWS.SQS();

var msgBusParams = {
  QueueUrl: configs.queueUri,
  MaxNumberOfMessages: 10
};

// ==== MIDDLEWARE ====

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
  d = new Date();
  console.log(d.toISOString(), '--', req.method, 'request being handled');
  next();
});

// ==== ROUTES ====

//Request for a particular user
app.get('/user', (req, res) => {
  let query = req.query || '';
  if (query.query) {
    if (query.query.length === 1) {
      //lookup by location
      // console.log('Got a location lookup for Zone', query.query);
      db.queryByLocation({
        location: query.query,
        genderFilter: query.gender,
        userFilter: query.filter,
        photoCount: query.photoCount
      }).then((data) => {
        res.contentType('application/json');
        res.status(200).send(data);
      }).catch((err) => {
        errorLog(err);
        res.status(500).send('An error occured', err);
      });
    } else {
      //lookup by ID
      // console.log('Got an ID lookup or ID', query.query);
      db.queryById(query.query).then((data) => {
        res.contentType('application/json');
        res.status(200).send(data);
      }).catch((err) => {
        errorLog(err);
        res.status(500).send('An error occured', err);
      });
    }
  } else {
    //No query. Look up random
    // console.log('Random lookup requested');
    db.getRandomUserByNumID().then((data) => {
      res.contentType('application/json');
      res.status(200).send(data);
    }).catch((err) => {
      errorLog(err);
      res.status(500).send('An error occured', err);
    });

  }
});

//Posting a new user. Not to be implemented for MVP
app.post('/user', (req, res) => {
  res.status(200).send('Membership by manual admin input only');
});

//Request for a list of users
app.get('/userlist', (req, res) => {
  res.contentType('application/json');
});

//Health check for AWS
app.get('/ping', (req, res) => {
  res.status(200).send();
});

//Listen to message bus
app.get('/recieve', (req,res) => {
  getMessages();
  res.status(200).end('Requested to recieve');
});

// ==== HELPER ====

let errorLog = (message) => {
  d = new Date();
  fs.appendFile(ERROR_LOG_PATH, `===== ${d.toISOString()}\n` + message + '\n', (err) => {});
  console.error(message);
};

let getMessages = () => {
  sqs.receiveMessage(msgBusParams, processMessages);
};

let processMessages = (err, data) => {
  // console.log('Processing queue response', err, data);
  if (data && data.Messages && data.Messages.length > 0) {
    for (var i=0; i < data.Messages.length; i++) {
      console.log(data.Messages[i]);
      var deleteOptions = {
        QueueUrl: configs.queueUri,
        ReceiptHandle: data.Messages[i].ReceiptHandle
      };

      sqs.deleteMessage(deleteOptions, (err, res) => {
        if (err) console.error(err);
      });
    }

    getMessages();

  } else {
    setTimeout(getMessages, 1000);
}
};

// ==== SERVER ====
app.listen(port, function() {
  console.log(`listening on port ${port}`);
});
