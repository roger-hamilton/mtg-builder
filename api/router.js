var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var moment = require('moment');
var _ = require('lodash');
var http = require('http');
var unzip = require('unzip');

var setData = {}, cardData = {}, sets = [];
console.log('Downloading AllCards-x.json.zip');
http.get('http://mtgjson.com/json/AllCards-x.json.zip', (res)=>{
  var file = unzip.Extract({path: path.join(__dirname,'data') });
  res.pipe(file);
  console.log('Unziping AllCards-x.json.zip');
  file.on('close', ()=>{
    console.log('Loading AllCards-x.json');
    cardData = require('./Data/AllCards-x');
    console.log('Loaded AllCards-x.json');
  })
})
console.log('Downloading AllSets-x.json.zip');
http.get('http://mtgjson.com/json/AllSets-x.json.zip', (res)=>{
  var file = unzip.Extract({path: path.join(__dirname,'data') });
  res.pipe(file);
  console.log('Unziping AllSets-x.json.zip');
  file.on('close', ()=>{
    console.log('Loading AllSets-x.json');
    setData = require('./Data/AllSets-x');
    sets  = _.values(setData).map(function(set){
      return _.omit(set, 'cards');
    });
    console.log('Loaded AllSets-x.json');
  })
})

router.get('/', function(req, res) {
  res.json({ message: 'hooray! welcome to our api!' });
});

router.route('/sets').get(function(req, res) {
  res.json(sets);
});

router.route('/sets/:set_code').get(function(req, res) {
  if(setData[req.params.set_code.toUpperCase()]){
    res.json(setData[req.params.set_code.toUpperCase()]);
  }
  else {
    res.json({error: 'no matching set'});
  }
});

router.route('/cards').get(function(req, res) {
  res.json(cardData);
});
function simpleCheck(checkIn, checkFor){
  return checkIn.indexOf(checkFor) >= 0;
}
router.route('/cards/search').get(function(req, res) {
  var per_page = (req.query.per_page||20) - 0;
  var page = (req.query.page||1) - 0;

  var filters= [];
  if(req.query.type){
    filters.push({key: 'type', value: req.query.type, check: simpleCheck})
  }
  if(req.query.name){
    filters.push({key: 'name', value: req.query.name})
  }
  if(req.query.color){
    filters.push({key: 'colors', array: true, value: req.query.color})
  }
  if(req.query.color_id){
    filters.push({key: 'colorIdentity', array: true, value: req.query.color_id})
  }
  if(req.query.rarity){
    filters.push({key: 'rarity', value: req.query.rarity})
  }
  if(req.query.text){
    filters.push({key: 'text', value: req.query.text})
  }

  if(req.query.format){
    filters.push({key:'legalities', format: true, value: req.query.format})
  }
  filters = filters.map(function(filter){
    return _.merge(filter, {value: filter.value.toLowerCase()})
  })


  var cards = cardData;
  if(filters.length){
    cards = _.filter(cards, function(card){
      return _.every(filters, function(filter, i){
        if(filter.array){
          return _.map(card[filter.key], _.lowerCase).indexOf(filter.value) >= 0
        }else if(filter.format){
          return _.map(card[filter.key], function(format){ return format.format.toLowerCase()}).indexOf(filter.value) >= 0
        }else{
          return card[filter.key].toLowerCase().indexOf(filter.value) >= 0;
        }
      })
    })
  }



  res.json(_.slice(cards, (page - 1) * per_page, page * per_page));
});

module.exports = exports = router;
