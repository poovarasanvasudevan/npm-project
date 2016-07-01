/**
 * Created by poovarasanv on 29/6/16.
 */
var Sequelize = require('sequelize');
var sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/database.sqlite'
});

module.exports = User;