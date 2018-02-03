'use strict';

const setupAddressCommand = require('./address');
const setupApiCommand = require('./api');
const setupBalanceCommand = require('./balance');
const setupDepthCommand =require('./depth');
const setupGenAddressesCommand = require('./genaddresses');
const setupHealthCommand = require('./health');
const setupHistoryCommand = require('./history');
const setupMWMCommand = require('./mwm');
const setupNeighborsCommand = require('./neighbors');
const setupNodeCommand = require('./node');
const setupNodeInfoCommand = require('./nodeinfo');
const setupPromoteCommand = require('./promote');
const setupReplayCommand = require('./replay');
const setupSeedCommand = require('./seed');
const setupTransferCommand = require('./transfer');
const setupValidators = require('./validations').setupValidators;

module.exports = (data, iotajs, refreshAccountData, vorpal) => {
  setupValidators(data, vorpal);

  setupAddressCommand(data, iotajs, vorpal);
  setupApiCommand(data, iotajs, vorpal);
  setupBalanceCommand(data, iotajs, vorpal);
  setupDepthCommand(data, vorpal);
  setupGenAddressesCommand(data, refreshAccountData, vorpal);
  setupHealthCommand(data, iotajs, vorpal);
  setupHistoryCommand(data, iotajs, vorpal);
  setupMWMCommand(data, vorpal);
  setupNeighborsCommand(data, iotajs, vorpal);
  setupNodeCommand(data, iotajs, refreshAccountData, vorpal);
  setupNodeInfoCommand(data, iotajs, vorpal);
  setupPromoteCommand(data, iotajs, refreshAccountData, vorpal);
  setupReplayCommand(data, iotajs, refreshAccountData, vorpal);
  setupSeedCommand(data, refreshAccountData, vorpal);
  setupTransferCommand(data, iotajs, vorpal);
};
