#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const config = require('./lib/config');
const IOTA = require('iota.lib.js');
const prompt = require('./lib/prompt');
const setupCommands = require('./lib/commands/index');
const vorpal = require('vorpal')();
const constants = require('./lib/constants');

const setDelimiter = prompt.setDelimiter;
const setupPrompt = prompt.setupPrompt;

const data = {
  accountData: undefined,
  currentNodeInfo: undefined,
  host: 'http://localhost',
  port: 14265,
  user: '',
  pass: '',
  depth: 3,
  maxNeighbors: 9,
  milestoneLag: 15,
  minNeighbors: 4,
  minWeightMagnitude: 3,
  seed: ''
};

const iotajs = new IOTA({host: data.host, port: data.port});

let refreshAccountDataTimer;
const refreshAccountData = () => {
  if (refreshAccountDataTimer) {
    clearTimeout(refreshAccountDataTimer);
  }

  if (data.seed) {
    iotajs.api.getAccountData(data.seed, (err, accountData) => {
      if (err) {
        // on fail, retry fast
        refreshAccountDataTimer = setTimeout(refreshAccountData, 10 * 1000);
        return;
      }

      if (!data.accountData) {
        vorpal.log(chalk.green('Account data retrieved.'));
      }
      data.accountData = accountData;
      setDelimiter();

      // on success, refresh slowly.
      refreshAccountDataTimer = setTimeout(refreshAccountData, 2 * 60 * 1000);
    });
  }
};

config.get('default_host', data.host).then(default_host => {
  const parts = default_host.match(constants.uriRegex);
  const protocol = parts[1] || defaultProtocol;
  data.user = parts[2];
  data.pass = parts[3];
  data.host = parts[4];
  config.get('default_port', data.port).then(default_port => {
    data.port = default_port;
    iotajs.changeNode({host: default_host, port: data.port});

    setupPrompt(data, iotajs, vorpal);
    setupCommands(data, iotajs, refreshAccountData, vorpal);
    const version = require('./package.json').version;
    vorpal.log(chalk.green(`Running IOTA CLI v${version}\n`));
    iotajs.api.getNodeInfo((err, nodeInfo) => {
      if (err) {
        data.currentNodeInfo = undefined;
        vorpal.log(chalk.red(`Error connecting to ${default_host}:${default_port}.`));
        vorpal.log(chalk.red(err));
      } else {
        data.currentNodeInfo = nodeInfo;
      }
      setDelimiter();
      vorpal.parse(process.argv);
      vorpal.show();
    });
  });
});
