# Tinder App - Users Service

User service for Tinder App. Handles and stores all the user information

## Roadmap

View the project roadmap [here](https://drive.google.com/open?id=1kAPJHYxOglYTeN3WJslR1_gGNFUneNer6oveAjPyoFA)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

# Table of Contents

1. [Usage](#Usage)
1. [API Usage](#api-usage)
    1. [Input](#input)
    1. [Output](#output)
1. [Requirements](#requirements)
1. [Development](#development)
    1. [Installing Dependencies](#installing-dependencies)
    1. [Tasks](#tasks)

## Usage

### API Usage

#### Input

Query will happen with one of two unique keys

```javascript
{
  query: NUMBER or STRING,
  gender: STRING,
  filter: ARRAY
}
```

- `query` Used with type __user__. User ID num or zone string. Returns random user when empty
- `gender` Used with type __user__ when querying by location. _[OPTIONAL]_. The gender of users to retrieve
- `filter` Used with type __user__ when querying by location. _[OPTIONAL]_. An array of user IDs to omit from results, e.g. swiped users

##### Example User Request Parameters

Get full information on user with ID _#7443_
```javascript
{
  query: 7443
}
```

Get a random user
```javascript
{
}
```

Get all females from _"Zone A"_ except userIDs _AV9LofjhxcHrw1GRCa9Z_ and _AV9LjC3EKmvG0ooIGY4T_
```javascript
{
  query: 'A',
  gender: 'F',
  filter: ['AV9LofjhxcHrw1GRCa9Z', 'AV9LjC3EKmvG0ooIGY4T']
}
```

#### Output

```javascript
[{
  id: NUMBER,
  name: STRING,
  email: STRING,
  gender: STRING,
  location: STRING,
  photoCount: NUMBER,
  dob: NUMBER,
  traits: ARRAY
}]
```

The return object has been built to include information irrelevant to the MVP, for future expansion opportunity

- `id` The user's ID number
- `name` The user's name
- `email` The user's email count
- `gender` The user's gender
- `location` Which zone the user is located in
- `photoCount` The number of photos the user has uploaded
- `dob` Represents year the user was born
- `traits` An array of objective terms that can be used to describe the user's physical appearance. Represents a photo of user.

## Requirements

- Node 6.9.x
- Postgresql 9.6.x
- express 4.16.2
- faker 4.1.0
- mocha 4.0.1
- chai 4.1.2
- pg 7.3.0
- pg-hstore 2.3.2
- sequelize 5.15.0

## Development
### Installing Dependencies
Run `npm install`

### Tasks

#### Simulation

- Simulate new user sign-ups
- Simulate account deletions
- Simulate user information pulls

#### Monitoring/Testing

- Time for insertion saved
- Time for retrieve saved
- Time for remove saved
- Errors logged out into log directory


## Other Information

Run `npm run document` to generate a JSDoc documentation directory

### Schema

__Users__

| col | type |
| ----- | -----:|
| name | VARCHAR |
| traits | VARCHAR |
| gender | VARCHAR |
| photo_count | INT |
| email | VARCHAR |
| location | VARCHAR |
