'use strict';
const chalk = require('chalk');

const setupGenAddressesCommand = (data, refreshAccountData, vorpal) => {
  vorpal
    .command('genAddresses <num>', 'Generate as many addresses as you feel you used on this seed. Can be necessary if you have old spent addresses with balances on them.')
    .alias('ga')
    .action((args, callback) => {
      if (!args.num || !Number.isInteger(args.num)) {
          vorpal.log(chalk.red('Please specify the number of addresses to generate.'));
          return callback();
      }
      if (args.num < 4) {
          vorpal.log(chalk.red('Please specify a number greater than 3.'));
          return callback();
      }
      else if (args.num > 1000) {
          vorpal.log(chalk.red('Too many addresses.'));
          return callback();
      }
      data.numAddresses = args.num;
      if(data.accountData) {
        vorpal.log(chalk.yellow(`Generating ${data.numAddresses} addresses then refreshing account data. With a high number of addresses this can take a long time. Please wait to be informed that Account data was retrieved. \n`));
        data.accountData = undefined;
        data.refreshAccountDataInterval = Math.max(2,Math.round(args.num/10)) * 60 * 1000
        refreshAccountData();
      }
      callback();
    });
};

module.exports = setupGenAddressesCommand;
