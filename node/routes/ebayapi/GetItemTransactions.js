var fs     = require('fs');
var mongo  = require('../mongoconnect');
var task   = require('./task');
var config = require('../../config');
var async  = require('async');
var moment = require('moment');
var clone  = require('clone');
var util   = require('util');
var ObjectID = require('mongodb').ObjectID;

var methods = {
    
    call: function(request, callback) {
        
        // todo: implement normal call
        
    }, // call()
    
    upsert: function(transactions, collection, callback) {
        
        if (!util.isArray(transactions)) {
            transactions = [transactions];
        }
        
        transactions.forEach(function(transaction) {
            
            var itemid = transaction.Item.ItemID;
            
            delete transaction.Item;
            
            methods.upsert_transaction(transaction, collection, itemid);
            
        }); // forEach()
        
    }, // upsert()
    
    upsert_transaction: function(transaction, collection, itemid) {
        
        var query = {
            'org.ItemID': itemid
        };
        
        collection.update(
            query,
            {
                $pull: {
                    transactions: {
                        TransactionID: transaction.TransactionID
                    }
                }
            },
            {
                safe: true
            },
            function (err, result) {
                collection.update(
                    query,
                    {
                        $push: {
                            transactions: transaction
                        }
                    }
                );
            }
        ); // update()
        
    } // upsert_transaction
    
} // methods

module.exports = methods;
