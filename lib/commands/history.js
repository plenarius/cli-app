'use strict';

const chalk = require('chalk');
const constants = require('../constants');
const isMissingData = require('./validations').isMissingData;
const leftPad = require('left-pad');
const moment = require('moment');
const prettyjson = require('prettyjson');

const setupHistoryCommand = (data, iotajs, vorpal) => {
  const showSpecificItem = (hash, callback) => {
    // The history command identifies every bundle by the hash of the first tx in it.
    const matchingBundles = data.accountData.transfers.filter(
      bundle => bundle[0].hash.indexOf(String(hash).toUpperCase()) !== -1
    );

    if (matchingBundles.length === 0) {
      vorpal.log(chalk.red('No transactions match that hash.\n'));
      return callback();
    }

    const cleanedUpBundles = matchingBundles.map(
      bundle => bundle.map(
        item => {
          const newItem = Object.assign({}, item);
          delete newItem.signatureMessageFragment;
          return newItem;
        }
      )
    );

    vorpal.log(prettyjson.render(cleanedUpBundles, constants.prettyJson), '\n');

    callback();
  };

  const showItems = (number, callback) => {
    const reverseTransfers = data.accountData.transfers.slice(0).reverse();
    const transfers = reverseTransfers.slice(0, number);

    const categorizedTransfers = iotajs.utils.categorizeTransfers(transfers, data.accountData.addresses);

    const biggestValue = transfers.reduce(
      (biggest, bundle) => biggest > bundle[0].value ? biggest : bundle[0].value,
      0
    ) + '';
    const persistences = transfers.reduce(
      (persists, bundle) => {
        if (bundle[0].persistence && persists.indexOf(bundle[0].bundle) === -1) {
          persists.push(bundle[0].bundle);
        }
        return persists;
      }, []);
    transfers.forEach((bundle, index) => {
      const shortAddress = bundle[0].address.slice(0, 6);
      const persisted = bundle[0].persistence ? bundle[0].persistence : false;
      let reattachConfirmed = false;
      if (!persisted && persistences.indexOf(bundle[0].bundle) !== -1) {
        reattachConfirmed = true;
      }
      const shortHash = bundle[0].hash.slice(0, 6);
      const time = moment.unix(bundle[0].timestamp).fromNow();
      const value = bundle[0].value;

      const thisCategorizeTransfer = categorizedTransfers.sent.filter(t => t[0].hash === bundle[0].hash);
      const type = bundle.length === 1 && bundle[0].value === 0
        ? leftPad('address', 13)
        : thisCategorizeTransfer.length > 0 ? 'spending from' : leftPad('receiving to', 13);

      vorpal.log(`${index < 9 ? ' ' : ''}${index+1}: ${chalk.yellow(shortHash)} - ${type} ${shortAddress} - ${leftPad(value, biggestValue.length)} - ${persisted ? chalk.green('confirmed       ') : reattachConfirmed ? chalk.cyan('bundle confirmed') : chalk.yellow('pending         ')} - ${time}`);
    });
    vorpal.log(chalk.cyan('\nTo see more information on a specific transaction, provide a hash next time.\n'));

    callback();
  };

  vorpal
    .command('history [hash]', 'Gets last transactions.  Provide a hash for additional details.')
    .option('-n <number>', 'Max number of transactions.  Default 10.')
    .autocomplete({
      data: () => {
        vorpal.ui.input(`history ${vorpal.ui.input().split(' ')[1].toUpperCase()}`);
        if (!data.accountData) {
          return [];
        }
        return data.accountData.transfers.map(b => b[0]).map(t => t.hash.slice(0, 6));
      }
    })
    .action((args, callback) => {
      if (isMissingData(['node', 'seed', 'accountData'])) {
        return callback();
      }

      if (args.hash) {
        showSpecificItem(args.hash, callback);
      } else {
        const number = args.options.n || 10;
        showItems(number, callback);
      }
    });
};

module.exports = setupHistoryCommand;
