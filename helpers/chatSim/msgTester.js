const generator = require('./generator.js');

const Chance = require('chance');
const chance = new Chance();

const maxSessions = 300;
const loveBar = 80;
const ACTION_DELAY = 50;

let numSessions = 0;
let messagesSent = 0;
let repliesSent = 0;
let matches = 0;
let ignoredMessages = 0;
let happyCouples = {};

let userSubset = [];
let relationTable = {}; //OPINION TABLE
let messages = []; //MESSAGES DB
let d = new Date();

// ==== MAIN ====
let main = () => {
  generateUsers(20);
  createSession();

  // console.log(JSON.stringify(userSubset, null, 2));
};

// ==== SESSION EMULATOR ====
class Session {
  constructor (user) {
    this.user = user;
    this.messagesToRead = [];
  }

  login () {
    console.log('\x1b[32m', this.user.name, 'is logging in', `Session ${numSessions + 1} of ${maxSessions}`);
    setTimeout(this.checkForMessages.bind(this), 300);
  }

  checkForMessages () {
    for (var i = 0; i < messages.length; i++) {
      if (messages[i].to.name === this.user.name) {
        this.messagesToRead.push(messages[i]);
        messages.splice(i, 1);
      }
    }
    if (this.messagesToRead.length > 0) {
      console.log(`\x1b[35m-- - ✉ ${this.user.name} got messages! ✉`);
      this.checkMessages();
    } else {
      this.getAndParseQueue();
    }
  }

  checkMessages () {
    this.readMessage();
  }

  getAndParseQueue () {
    //Look through users and potentuially generate a message
    let queue = returnAllButSelf(this.user);
    console.log('\x1b[36m', this.user.name, 'requested a queue and is to swipe through it');
    //Pick 3 users and act on them
    let ran = Math.floor(Math.random() * (queue.length - 3));
    for (var i = ran; i < ran + 3; i++) {
      this.judgeUser(queue[i]);
    }
    setTimeout(this.logout.bind(this), ACTION_DELAY);
  }

  judgeUser (targetUser) {
    console.log('\x1b[36m--', this.user.name, 'is judging', targetUser.name);
    formFirstImpression(this.user, targetUser);
    console.log(`\x1b[36m-- - ${this.user.name}'s opinion score of ${targetUser.name} is... ${relationTable[this.user.name][targetUser.name]}`);

    if (relationTable[this.user.name][targetUser.name] > 60) {
      this.sendMessage(this.user, targetUser);
    }
  }

  sendMessage (user, targetUser) {
    //Send a message to user based on compatability score
    console.log(`\x1b[35m-- - ✉ ${user.name} sent a message to ${targetUser.name}! ✉`);
    messagesSent++;
    messages.push({
      from: user,
      to: targetUser,
      message: 'Hello!'
    });
  }

  readMessage () {
    if (this.messagesToRead.length <= 0) {
      //No messages, swipe a queue before going home
      this.getAndParseQueue();
    } else {
      //There's a message, read it
      let message = this.messagesToRead.shift();
      console.log(`\x1b[35m-- - ✉ ${this.user.name} read a message from ${message.from.name}! ✉`);
      formFirstImpression(this.user, message.from);
      if (relationTable[this.user.name][message.from.name] > 50 && relationTable[this.user.name][message.from.name] <= 100) {
        repliesSent++;
        changeImpressions(this.user, message.from, 10);
        this.sendMessage(this.user, message.from);
      } else if (relationTable[this.user.name][message.from.name] > 100) {
        console.log(`\x1b[35m-- - 📅 ${this.user.name} and ${message.from.name} are already planning a date 📅`);
      } else {
        console.log(`\x1b[35m-- - ✉ Sadly, ${this.user.name} doesn't like ${message.from.name} much (score ${relationTable[this.user.name][message.from.name]}) ✉`);
        message.from.rejections = message.from.rejections + 1 || 1;
        ignoredMessages++;
      }
      setTimeout(this.readMessage.bind(this), ACTION_DELAY);
    }
  }

  logout () {
    console.log('\x1b[33m', this.user.name, 'is logging out');
    createSession();
  }
}

let finishSim = () => {
  console.log('\x1b[41m==== SIM ENDED ====\x1b[0m\n');

  console.log('\x1b[0m' + messages.length, 'left unread');
  console.log('Messages sent:', messagesSent);
  console.log('Replies sent:', repliesSent);
  console.log('Matches made:', matches);
  console.log('Unrequited love:', ignoredMessages);
  printCouples();
  printMostReject();
  process.exit();
};

let printCouples = () => {
  console.log(`\n\x1b[31m\x1b[47m❤❤ 🎉 Congratulate our happy couples! 🎉 ❤❤\x1b[0m`);
    for (var key in happyCouples) {
      console.log(key);
    }
};

let printMostReject = () => {
  let maxRejects = 0;
  let rejectedUser = {};
  for (var user of userSubset) {
    if (user.rejections > maxRejects) {
      maxRejects = user.rejections;
      rejectedUser = user;
    }
  }
  console.log(`\x1b[44m${rejectedUser.name} has been rejected the most, with ${maxRejects} ignored messages 😣 \x1b[0m\n`);
}

// ==== HELPERS ====
let generateUsers = (n) => {
  for (var i = 0; i < n; i++) {
    let newUser = generator.constructNewUser();
    console.log('\x1b[2m', newUser.name, 'joined the miniTimder service\x1b[0m');
    relationTable[newUser.name] = {};
    userSubset.push(newUser);
  }
};

let createSession = () => {
  if (numSessions >= maxSessions) {
    finishSim();
    return;
  }
  let newSession = new Session(userSubset[Math.floor(Math.random() * userSubset.length)]);
  newSession.login();
  numSessions++;
};

let changeImpressions = (user, targetUser, change) => {
  relationTable[user.name][targetUser.name] += change;
  if (relationTable[user.name][targetUser.name] > loveBar && relationTable[targetUser.name][user.name] > loveBar) {
    console.log(`\x1b[31m\x1b[47m❤❤ Love was found between ${user.name} and ${targetUser.name}! ❤❤\x1b[0m`);
    relationTable[user.name][targetUser.name] = 101;
    relationTable[targetUser.name][user.name] = 101;
    happyCouples[user.name + ' ❤ ' + targetUser.name] = 1;
    matches++;
  }
};

//Form a starter relation table based on user's preferences
let formFirstImpression = (user, targetUser) => {
  if (relationTable[user.name][targetUser.name] !== undefined) return;

  let score = 50;
  //Check age range
  let user1Age = d.getFullYear() - user.dob;
  let user2Age = d.getFullYear() - targetUser.dob;
  let ageDiff = Math.abs(user1Age - user2Age);
  if (ageDiff > 10) {
    score -= ageDiff;
  }

  //Check location
  if (user.location !== targetUser.location) {
    score -= 20;
  }

  //User's desperation
  score += sdbmCode(user.name, 6, 40) - 20;
  //User's sexuality
  if (sdbmCode(user.name, 6, 100) < 90) {
    if (user.gender === targetUser.gender) score -= 70;
  }

  //Check Photo count
  let preferredPhotoCount = sdbmCode(user.name, 6, 6);
  let photoCountDiff = Math.abs(targetUser.photoCount - preferredPhotoCount);
  if (photoCountDiff === 0) {
    score += 40;
  } else if (photoCountDiff === 1) {
    score += 20;
  }
  score += Math.floor(Math.random() * 30) - 10;
  relationTable[user.name][targetUser.name] = score;
};

let returnAllButSelf = (user) => {
  return userSubset.filter((ele) => {
    return ele.name !== user.name;
  });
};

let parseMessage = (message) => {
  let score = 0;

  return score;
};

let generateMessage = (style) => {
  if (style === 'positive') {
    return chance.sentence({ words: 8 }) + ' (happy)';
  } else {
    return chance.sentence({ words: 5 }) + ' (sad)';
  }
};

// ==== HELP THE HELPERS ====
let sdbmCode = function(str, salt, max = 100){
    var hash = 0;
    for (i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = char + (hash << salt) + (hash << 16) - hash;
    }
    return Math.abs(hash % max);
};

let colorLog = (color, ...messages) => {

};

// ==== RUN ALL THE THINGS ====
main();
