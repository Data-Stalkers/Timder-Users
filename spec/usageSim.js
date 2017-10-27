const axios = require('axios');

const SERVER_URL = require('../config/config.js').serverUri;
const SESSION_DELAY = 2000;
const SESSION_DELAY_VARIANCE = 3000;


let simState = {
  openSessions: []
}

class Sessions {
  constructor (user) {
    this.user = user;
  }


}

let sessionLoop = () => {
  axios.get(SERVER_URL + '/user', { params: { query: 'A' } }).then((res) => {
    console.log(res.data);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
  // console.log(SERVER_URL);
}

sessionLoop();

//Random user signs on
//User requests a queue by his/her location and gender
//User will swipe through the list and add it to the filter list
//User requests another queue
//User ends session
