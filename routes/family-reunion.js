var express = require('express');
var router = express.Router();
let HAM = require('@harvardartmuseums/ham');

let applicationInfo = {
  title: 'Family Reunion',
  description: 'Three galleries in ten years'
};

let ham = new HAM(process.env.HAM_APIKEY);

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('family-reunion/index', { about: applicationInfo });
});

router.get('/floor-3', async function(req, res, next) {
  res.render('family-reunion/floor-3', {about: applicationInfo});
})

router.get('/poster', async function(req, res, next) {
  let params =  {
    venue: 'HAM',
    after: 'begindate:2014-11-15',
    size: 100,
    sort : 'chronological'
  };
  let exhibition = await ham.Exhibitions.search(params);
  exhibition = exhibition.records;

  // process date here

  for (let i = 0; i < exhibition.length; i++){
    let begin = exhibition[i].begindate.split("-");
    exhibition[i].beginYear = parseInt(begin[0]);
    exhibition[i].beginMonth = parseInt(begin[1]);
    
    let end = exhibition[i].enddate.split("-");
    exhibition[i].endYear = parseInt(end[0]);
    exhibition[i].endMonth = parseInt(end[1]);
  }

  // process and delete the exhibits not on floor 3
  
  function notOnFloorThree(exhibit) {
    return exhibit.venues[0].galleries[0].floor === "3";
  }

  exhibition = exhibition.filter(notOnFloorThree);

  res.render('family-reunion/poster', {layout: 'layout-family-reunion.hbs', about: applicationInfo, data: exhibition});
});

module.exports = router;