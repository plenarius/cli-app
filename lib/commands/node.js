'use strict';

const chalk = require('chalk');
const config = require('../config');
const constants = require('../constants');
const prompt = require('../prompt');

const setDelimiter = prompt.setDelimiter;

const setupNodeCommand = (data, iotajs, refreshAccountData, vorpal) => {
  vorpal
    .command('node <address>', 'connects to a new iota node. (ex. 1.2.3.4)')
    .autocomplete({
      data: () => config.get('nodes', ['localhost:12465'])
    })
    .action((args, callback) => {
      if (!args.address) {
        return;
      }

      const defaultProtocol = 'http://';
      const defaultPort = 14265;
      const defaultUser = '';
      const defaultPassword = '';
      const parts = args.address.match(constants.uriRegex);
      if (!parts || !parts[4]) {
        vorpal.log(chalk.red('Invalid url entered.'));
        return callback();
      }
      const protocol = parts[1] || defaultProtocol;
      data.user = parts[2] || defaultUser;
      data.pass = parts[3] || defaultPassword;
      data.host = parts[4];
      data.port = Number(parts[5] || defaultPort);
      if (Number.isNaN(data.port)) {
        vorpal.log(chalk.red('Port must be a number.  (ex. 1.2.3.4:12465)'));
        return callback();
      }
      let auth = "";
      if (data.user !== defaultUser && data.pass !== defaultPassword) {
        auth = `${data.user}:${data.pass}@`;
      }
      const host = `${protocol}${auth}${data.host}`;
      const port = data.port;
      const host_str = `${host}:${port}`;

      iotajs.changeNode({host, port});
      if (host !== 'http://localhost') {
        vorpal.log(`Changing node to ${host}:${port}. This may take a few seconds for a remote node.  Did you turn on remote access?`);
      }

      iotajs.api.getNodeInfo((err, nodeInfo) => {
        if (err) {
          data.currentNodeInfo = undefined;
          vorpal.log(chalk.red(`Error connecting to ${host_str}.`));
          vorpal.log(chalk.red(err));
          return callback();
        }
        data.currentNodeInfo = nodeInfo;
        config.set('default_host', host).then(default_host => {
          config.set('default_port', port).then(default_port => {
            data.minWeightMagnitude = 14;
            refreshAccountData();
            config.get('nodes', []).then(nodes => {
              const nodehost = `${iotajs.host}:${iotajs.port}`;
              const node = nodehost.replace(/https?:\/\//i, '');
              if (nodes.indexOf(node) === -1) {
                nodes.push(node);
                nodes = nodes.sort();
                config.set('nodes', nodes);
              }
            });
            setDelimiter();
            callback();
          });
        });
      });
    });
};

module.exports = setupNodeCommand;
