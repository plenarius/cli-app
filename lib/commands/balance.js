'use strict';

const chalk = require('chalk');
const collapseIotaAmount = require('../utils').collapseIotaAmount;
const isMissingData = require('./validations').isMissingData;
const Promise = require('bluebird'); // For older node systems that don't have promise built in.

let elapsedInterval;

// TODO try this again with the getAccountData command.  For now that is a bit buggy.
// https://github.com/iotaledger/iota.lib.js/pull/16
const setupBalanceCommand = (data, iotajs, vorpal) => {
  vorpal
    .command('balance', 'Gets balance for current seed')
    .action((args, callback) => {
      if (isMissingData(['node', 'seed'])) {
        return callback();
      }

      vorpal.log('One moment while we collect the data.');
      const start = Date.now();
      elapsedInterval = setInterval(() => {
        process.stdout.write(`You've been waiting ${Math.floor((Date.now() - start)/1000)}s\r`);
      });

      new Promise((resolve, reject) => {
        iotajs.api.getBalances(data.accountData.addresses, 100, (err, balance_data) => {
          if (err) {
            return reject(err);
          }

          if (elapsedInterval) {
            clearInterval(elapsedInterval);
            const addrInfo = data.accountData.addresses.map((x, i) => {
                return {"addr": x, "bal": balance_data.balances[i], "sent": 0, "received": 0}
            });
            data.accountData.transfers.forEach( (bundle, index) => {
              bundle.forEach((txfr, index) => {
                if (txfr.persistence && data.accountData.addresses.indexOf(txfr.address) !== -1) {
                  addrInfo.forEach((addr_info, index) => {
                    if (addr_info.addr == txfr.address) {
                      if (txfr.value < 0) {
                        addr_info.sent += 1;
                      }
                      else if (txfr.value > 0) {
                        addr_info.received += 1;
                      }
                    }
                  });
                }
              });
            });
            let totalBalance = 0;
            vorpal.log(chalk.green('Balance data retrieved. Iota exist on the following address(es):'));
            addrInfo.forEach(addr_info=> {
              if (Number(addr_info.bal) >= 0) {
                totalBalance += Number(addr_info.bal);
                vorpal.log(`${chalk.cyan(addr_info.addr)} Receives:${chalk.green(addr_info.received)} Spends:${chalk.red(addr_info.sent)} Balance:${chalk.yellow(collapseIotaAmount(Number(addr_info.bal)))}ι`);
              }
            });
            vorpal.log(`Your current balance is ${chalk.yellow(totalBalance + "i")}.\n`);
          }

          resolve();
        });
      })
      .catch(err => {
        if (elapsedInterval) {
          clearInterval(elapsedInterval);
          vorpal.log(chalk.red(err), '\n');
        }
      })
      .finally(callback);
    })

    .cancel(() => {
      clearInterval(elapsedInterval);
      iotajs.api.interruptAttachingToTangle(() => {});
      vorpal.log(chalk.red('cancelled\n'));
    });
};

module.exports = setupBalanceCommand;
