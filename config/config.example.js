
let configs = {
  elasticUri: URL_TO_ES_DATABASE,
  serverUri: DIRECT_URL_TO_EC2_1,
  dockedUri: DIRECT_URL_TO_EC2_2,
  lbUri: URL_TO_LOAD_BALANCER,
  timderAccess: ACCESS_KEY_FOR_AWS,
  timderSecret: SECRET_KEY_FOR_AWS,
  queueUri: URL_TO_MSG_BUS
};

module.exports = configs;
