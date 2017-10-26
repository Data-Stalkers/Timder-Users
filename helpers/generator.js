var faker = require('faker');

let d = new Date();

let getRandom = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

let getZone = () => {
  //Weighted zoning
  let rng = Math.random() * 100;
  if (rng > 90) {
    return 'A';
  } else if (rng > 70) {
    return 'B';
  } else if (rng > 65) {
    return 'C';
  } else if (rng > 40) {
    return 'D';
  } else {
    return 'E';
  }
};

let getPhotosCount = () => {
  return Math.floor(Math.random() * 5) + 1;
};

/** Generates a random eye color, hair color, and facial expression as a stand-in for a photo */
let getTraits = () => {
  //Non weighted generation
  let result = [];
  //Eyes
  result.push(getRandom(['Brown Eyes', 'Brown Eyes', 'Blue Eyes', 'Green Eyes']));
  //Hair
  result.push(getRandom(['Black Hair', 'Brown Hair', 'Blonde Hair', 'Dyed Hair']));
  //Expression
  result.push(getRandom(['Smiling', 'Frowning', 'Neutral', 'Silly', 'Edgy']));

  return result;
};

/**
 * Generates a weighted birthyear for user.
 *
*/
let getDoB = () => {
  let year = d.getFullYear();
  let rng = Math.random() * 100;
  let generation;
  if (rng > 80) {
    generation = 10;
  } else if (rng > 50) {
    generation = 20;
  } else if (rng > 20) {
    generation = 30;
  } else if (rng > 8) {
    generation = 40;
  } else {
    generation = 50;
  }
  return year - generation - (Math.floor(Math.random() * 10));
};

let getGender = (input) => {
  if (input === 1) {
    return 'F';
  } else if (input === 0) {
    return 'M';
  }
  return 'O';
}

/**
 * Assembles a new user object using all the helper methods
 * @exports constructNewUser
*/
let constructNewUser = () => {
  let gender = Math.floor(Math.random() * 2);
  let newName = {
    firstName: faker.name.firstName(gender),
    lastName: faker.name.lastName()
  };
  let newUser = {
    name: newName.firstName + ' ' + newName.lastName,
    email: faker.internet.email(newName.firstName, newName.lastName),
    gender: getGender(gender),
    location: getZone(),
    photoCount: getPhotosCount(),
    dob: getDoB(),
    traits: JSON.stringify(getTraits())
  };
  // console.dir(newUser);
  return newUser;
}

module.exports = {
  constructNewUser
};
