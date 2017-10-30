const axiosP = require('axios');
const fs = require('fs');

const SERVER_URL = require('../config/config.js').serverUri;
const SERVER_URL_2 = require('../config/config.js').dockedUri;
const SERVER_LB = require('../config/config.js').lbUri;

const SESSION_DELAY = 50;
const SESSION_DELAY_VARIANCE = 500;
const SESSIONS_TO_SIMULATE = 300;
const ERROR_LOG_PATH = './logs/simLog.txt';

let axios = axiosP.create();
axios.defaults.timeout = 5000;

let simState = {
  openSessions: [],
  totalSessions: 0,
  queuesRequested: 0,
  rageQuits: 0,
  maxUsers: 0,
  loginFails: 0,
  errors: {}
}

let nextUserTime;
let reqNum = 0;

let genderFlip = (gender) => {
  if (Math.random() < .1) {
    return gender;
  } else {
    return (gender === 'M') ? 'F' : 'M';
  }
};

let endReport = () => {
  console.log('\x1b[41m==== SIM ENDED ====\x1b[0m\n');
  console.log('Session delay and variance:', SESSION_DELAY, SESSION_DELAY_VARIANCE);
  console.log('Queues requested:', simState.queuesRequested);
  console.log('Rage Quits:', simState.rageQuits);
  console.log('Peak user activity:', simState.maxUsers);
  console.log('Login Fails:', simState.loginFails);
  console.log('Last login user number:', simState.totalSessions);
  var failRate = Math.floor(((simState.rageQuits + simState.loginFails) / (simState.totalSessions + simState.queuesRequested)) * 100);
  console.log('\x1b[41mFail rate:', failRate, '%\x1b[0m\n');
  console.log('Errors tracked:', JSON.stringify(simState.errors, null, 4))
  process.exit();
};

let getServerUrl = () => {
  return SERVER_LB;
  if (reqNum % 2 === 0) {
    return SERVER_URL;
  } else {
    return SERVER_URL;
  }
};

class Session {
  constructor (user) {
    this.user = user;
    this.swiped = [];
    this.queuesBrowsed = 0;
    this.queuesToBrowse = Math.floor(Math.random() * 6) + 1;
  }

  init () {
    console.log('\x1b[32m++', this.user.name, 'began a session');
    // console.log('+Current users:', simState.openSessions.length + 1, '\x1b[0m');
    this.requestQueue();
  }

  requestQueue () {
    if (this.queuesBrowsed >= this.queuesToBrowse) {
      this.end();
      return;
    } else {
      // console.log(this.user.name, 'requested a queue');
      // let myID = simState.queuesRequested;
      let params = {
        query: 'A',
        gender: genderFlip(this.user.gender),
        filter: this.swiped,
        reqID: reqNum
      }
      axios.get(getServerUrl() + '/user', { params: params }).then((res) => {
        // console.log(res);
        simState.queuesRequested++;
        this.swipeQueue(res.data);
        console.log('\x1b[2m', this.user.name, 'got a queue and is swiping through it\x1b[0m');
        reqNum++;
      }).catch((err) => {
        // console.log(err);
        errorLog(err, 'Queue retrieve fail for ' + this.user.name + '- Req ID #' + reqNum, JSON.stringify(params, null, 2));
        // simState.errors[err.code] = simState.errors[err.code] + 1 || 1;
        simState.rageQuits++;
        // console.error('\x1b[31m', this.user.name, 'failed to get a queue and is now blowing up\x1b[0m');
        this.end();
      });
    }
  }

  swipeQueue (fullQueue) {
    //add to swiped list
    for (var i = 0; i < fullQueue.length; i++) {
      this.swiped.push(fullQueue[i].id);
    }
    this.queuesBrowsed++;

    //It takes everyone 10 seconds to fly through a queue of 50 users
    setTimeout(() => {
      // console.log('\x1b[2m', this.user.name, 'swiped through the queue\x1b[0m');
      this.requestQueue();
    }, 10000);

  }

  end () {
    console.log('\x1b[34m--', this.user.name, 'is ending their session\x1b[0m');
    simState.openSessions.splice(simState.openSessions.indexOf(this), 1);
    // console.log('\x1b[36m-Current users:', simState.openSessions.length, '\x1b[0m');
    if (simState.openSessions.length <= 0) {
      endReport();
    }
  }
}

// ==== Simulator ====

let sessionLoop = () => {
  if (simState.totalSessions + 1 >= SESSIONS_TO_SIMULATE) return;
  //Pull a random user and open a session for them
  axios.get(getServerUrl() + '/user').then((res) => {
    console.log('\x1b[36m+User #' + (simState.totalSessions + 1) + '/' + SESSIONS_TO_SIMULATE, 'is signing on\x1b[0m');
    let newSession = new Session(res.data);
    newSession.init();

    simState.openSessions.push(newSession);
    checkMaxUsers();
    reqNum++;
  }).catch((err) => {
    errorLog(err, 'Login fail', 'New user');
    simState.loginFails++;
  });
  //Schedule the next user login
  simState.totalSessions++;
  nextUserTime = Math.floor(Math.random() * SESSION_DELAY_VARIANCE) + SESSION_DELAY;
  setTimeout(sessionLoop, nextUserTime);
}

let checkMaxUsers = () => {
  if (simState.openSessions.length > simState.maxUsers) {
    simState.maxUsers = simState.openSessions.length;
  }
};

let errorLog = (err, message, req) => {
  d = new Date();
  simState.errors[err] = simState.errors[err] + 1 || 1;
  fs.appendFile(ERROR_LOG_PATH, `===== ${d.toISOString()}\n  ` + err.code + '; ' + message + '\n  ' + err + '\n ' + req + '\n', (err) => {});
  console.error('\x1b[31m', message, '\x1b[0m');
};

sessionLoop();

//Random user signs on
//User requests a queue by his/her location and gender
//User will swipe through the list and add it to the filter list
//User requests another queue
//User ends session
