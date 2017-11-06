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
const MESSAGE_GET_DELAY = 1000;

let d;

AWS.config.update({
  region: 'us-west-1',
  accessKeyId: configs.timderAccess,
  secretAccessKey: configs.timderSecret
});
const sqs = new AWS.SQS();
const msgBusParams = {
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
  let success = (data) => {
    res.contentType('application/json');
    res.status(200).send(data);
  };
  let failure = (err) => {
    errorLog(err);
    res.status(500).send('An error occured', err);
  };
  findUser(query, success, failure);
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
app.get('/receive', (req,res) => {
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
      let query;
      // console.log('Parsing:', data.Messages[i].Body);
      try {
        query = JSON.parse(data.Messages[i].Body);
      } catch (e) {
        // console.error('Parsing error:', e);
        query = { query: undefined };
      }

      let success = (data) => {
        publishMessage(data, query);
      };
      let failure = (err) => {
        errorLog(err);
      };
      findUser(query, success, failure);

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
    setTimeout(getMessages, MESSAGE_GET_DELAY);
  }
};

let publishMessage = (data, query) => {
  if (Array.isArray(data)) {
    data = {
      query: query,
      data: data
    };
  }

  var publishParams = {
    MessageBody: JSON.stringify(data),
    QueueUrl: configs.queueOutUri
  };

  sqs.sendMessage(publishParams, function(err, data) {
    if (err) {
      console.log('Error publishing', err);
    }
    // console.log(data);
  });
};

let findUser = (query, success, failure) => {
  if (query.query) {
    if (query.query.length === 1) {
      // console.log('Got a location lookup for Zone', query.query);
      db.queryByLocation({
        location: query.query,
        genderFilter: query.gender,
        userFilter: query.filter,
        photoCount: query.photoCount
      }).then((data) => {
        success(data);
      }).catch((err) => {
        failure(err);
      });
    } else {
      // console.log('Got an ID lookup or ID', query.query);
      db.queryById(query.query).then((data) => {
        success(data);
      }).catch((err) => {
        failure(err);
      });
    }
  } else {
    // console.log('Random lookup requested');
    db.getRandomUserByNumID().then((data) => {
      success(data);
    }).catch((err) => {
      failure(err);
    });
  }
}

// ==== SERVER START ====
app.listen(port, function() {
  console.log(`listening on port ${port}`);
});

//Start polling for messages
// getMessages();
