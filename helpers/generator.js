var faker = require('faker');
var Chance = require('chance');
var chance = new Chance();

let d = new Date();

/**
 * @module
 */

/**
 * Helper function to pull a random element from an array
 * @param {Array} array The array of elements to pick from
 * @returns {Object} One of whatever's in the array
 * @function
 */
let getRandom = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Gets a weighted random zone to populate the location property for user.
 * 10%: A - 20%: B - 5%: C - 25%:D - 40%:E
 * @function
 * @returns {string} A zone
 */
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

/**
 * Returns a random photo count for the user's photoCount property.
 * @function
 * @returns {number} A number from 1-6
 */
let getPhotosCount = () => {
  return Math.floor(Math.random() * 5) + 1;
};

/**
 * Generates a random eye color, hair color, and facial expression as a stand-in for a photo
 * @function
 * @returns {Array} Array of traits
 */
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
 * @returns {number} The birth year
 * @function
*/
let getDoB = () => {
  let year = d.getFullYear();
  let rng = Math.random() * 100;
  let generation;
  if (rng > 85) {
    generation = 13;
  } else if (rng > 50) {
    generation = 20;
  } else if (rng > 20) {
    generation = 30;
  } else if (rng > 8) {
    generation = 40;
  } else {
    generation = 50;
  }
  return year - generation - (Math.floor(Math.random() * 12));
};

/**
 * Returns either 'M' or 'F'
 * @returns {string} One of two primary genders
 * @function
 */
let getGender = (input) => {
  if (input === 1) {
    return 'F';
  } else if (input === 0) {
    return 'M';
  }
  return 'O';
}

let getGenderForChance = (input) => {
  if (input === 1) {
    return 'female';
  } else if (input === 0) {
    return 'male';
  }
  return 'O';
}

/**
 * Assembles a new user object using all the helper methods
 * @function
 * @instance
 * @returns {Object} A user object to be stored in the database or manipulated
 */
let constructNewUser = () => {
  let gender = Math.floor(Math.random() * 2);
  let newName = {
    firstName: chance.first({ gender: getGenderForChance(gender) }),
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

// constructNewUser();

module.exports = {
  constructNewUser
};
