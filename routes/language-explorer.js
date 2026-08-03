var express = require('express');
var router = express.Router();
let HAM = require('@harvardartmuseums/ham');
let _ = require('lodash');
var dataset = require('../data/loai/dataset');
var descriptions = require('../data/loai/descriptions');

let applicationInfo = {
  title: 'Language of AI',
  description: ''
};

let ham = new HAM(process.env.HAM_APIKEY);

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('language-explorer/index', { about: applicationInfo, data:dataset });
});

router.get('/grid', async function(req, res, next) {
  res.render('language-explorer/grid', { about: applicationInfo, data:dataset });
});

router.get('/:id', async function(req, res, next) {
  let id = parseInt(req.params.id);

  // get and prepare the descriptions
  let data = descriptions.filter(r => {
    // return r.ObjectID === id && r.Environment === 'cloud';
    return r.ObjectID === id && r.Service === 'Anthropic Claude';
    // return r.ObjectID === id && r.Service === 'Azure OpenAI';
  });
  data.forEach(d => {
    d.EnteredDateShort = d.EnteredDate.substring(0,10);    
  });
  data = _.sortBy(data, ['EnteredDateShort', 'Service']);
  data = _.groupBy(data, 'EnteredDateShort');
  
  // get the basic object information
  let object = dataset.find(r => {
    return r.objectid === id;
  });
  
  res.render('language-explorer/details', { about: applicationInfo, object:object, descriptions:data });
});

module.exports = router;