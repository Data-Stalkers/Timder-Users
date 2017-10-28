const express = require('express');
const bodyParser = require('body-parser');
const db = require('../database/index.js');
const fs = require('fs');
const app = express();

const ERROR_LOG_PATH = './logs/serverLog.txt';
const port = 3000;
let d;

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
        userFilter: query.filter
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

// ==== HELPER ====

let errorLog = (message) => {
  d = new Date();
  fs.appendFile(ERROR_LOG_PATH, `===== ${d.toISOString()}\n` + message + '\n', (err) => {});
  console.error(message);
};

// ==== SERVER ====
app.listen(port, function() {
  console.log(`listening on port ${port}`);
});
