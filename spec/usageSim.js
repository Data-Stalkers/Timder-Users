const axios = require('axios');

const SERVER_URL = require('../config/config.js').serverUri;
const SESSION_DELAY = 5;
const SESSION_DELAY_VARIANCE = 1000;
const SESSIONS_TO_SIMULATE = 200;


// axios.get(SERVER_URL + '/user', { params: { query: 'A', gender: 'F' } }).then((res) => {

let simState = {
  openSessions: [],
  totalSessions: 0,
  queuesRequested: 0,
  rageQuits: 0,
  maxUsers: 0,
  loginFails: 0
}

let nextUserTime;

let genderFlip = (gender) => {
  if (Math.random() < .1) {
    return gender;
  } else {
    return (gender === 'M') ? 'F' : 'M';
  }
};

let endReport = () => {
  console.log('\x1b[41m==== SIM ENDED ====\x1b[0m\n');
  console.log('Queues requested:', simState.queuesRequested);
  console.log('Rage Quits:', simState.rageQuits);
  console.log('Peak user activity:', simState.maxUsers);
  console.log('Login Fails:', simState.loginFails);
  console.log('Last login user number:', simState.totalSessions);
  console.log('\x1b[41mFail rate:', Math.floor(simState.rageQuits / simS.totalSessions), '\x1b[0m\n');
  process.exit();
};

class Session {
  constructor (user) {
    this.user = user;
    this.swiped = [];
    this.queuesBrowsed = 0;
    this.queuesToBrowse = Math.floor(Math.random() * 4) + 1;
  }

  init () {
    console.log('\x1b[32m++', this.user.name, 'began a session');
    console.log('+Current users:', simState.openSessions.length + 1, '\x1b[0m');
    this.requestQueue();
  }

  requestQueue () {
    if (this.queuesBrowsed > this.queuesToBrowse) {
      this.end();
      return;
    }
    console.log(this.user.name, 'requested a queue');
    axios.get(SERVER_URL + '/user', { params: {
      query: 'A',
      gender: genderFlip(this.user.gender),
      filter: this.swiped
    } }).then((res) => {
      simState.queuesRequested++;
      this.swipeQueue(res.data);
      console.log('\x1b[2m', this.user.name, 'got a queue and is swiping through it\x1b[0m');
    }).catch((err) => {
      simState.rageQuits++;
      console.error('\x1b[31m', this.user.name, 'failed to get a queue and is now blowing up\x1b[0m');
      this.end();
    });
  }

  swipeQueue (fullQueue) {
    //add to swiped list
    for (var ele of fullQueue) {
      this.swiped.push(ele.id);
    }
    this.queuesBrowsed++;

    //It takes everyone 10 seconds to fly through a queue of 50 users
    setTimeout(() => {
      console.log('\x1b[2m', this.user.name, 'swiped through the queue\x1b[0m');
      this.requestQueue();
    }, 10000);

  }

  end () {
    console.log('\x1b[34m--', this.user.name, 'is ending their session\x1b[0m');
    simState.openSessions.splice(simState.openSessions.indexOf(this), 1);
    console.log('\x1b[36m-Current users:', simState.openSessions.length, '\x1b[0m');
    if (simState.openSessions.length <= 0) {
      endReport();
    }
  }
}

// ==== Simulator ====

let sessionLoop = () => {
  if (simState.totalSessions >= SESSIONS_TO_SIMULATE) return;
  //Pull a random user and open a session for them
  axios.get(SERVER_URL + '/user').then((res) => {
    // console.log(res.data);
    console.log('\x1b[36m+User #' + (simState.totalSessions + 1) + '/' + SESSIONS_TO_SIMULATE, 'is signing on\x1b[0m');
    let newSession = new Session(res.data);
    newSession.init();

    simState.openSessions.push(newSession);
    checkMaxUsers();

  }).catch((err) => {
    console.log('\x1b[31m=== Error getting a user!! ===\x1b[0m');
    simState.loginFails++;
    // console.error(err);
    // process.exit(1);
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

sessionLoop();

//Random user signs on
//User requests a queue by his/her location and gender
//User will swipe through the list and add it to the filter list
//User requests another queue
//User ends session
