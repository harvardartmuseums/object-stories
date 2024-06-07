var express = require('express');
var router = express.Router();
let HAM = require('@harvardartmuseums/ham');
let exhibition_size = require('../data/exhibition_size');

let applicationInfo = {
  title: 'Family Reunion',
  description: 'Three galleries in ten years'
};

let ham = new HAM(process.env.HAM_APIKEY);

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('family-reunion/index', { about: applicationInfo });
});

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
    // merge fields from exhibtions data with exhibition
    exhibition[i].objectcount = exhibition_size.find(ex => ex.exhibitionid === exhibition[i].exhibitionid).objectcount;

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

router.get('/floor-3', async function(req, res, next) {
  let params =  {
    venue: 'HAM',
    after: 'begindate:2014-11-15',
    size: 100,
    sort : 'chronological'
  };
  let exhibition = await ham.Exhibitions.search(params);
  exhibition = exhibition.records;
  function notOnFloorThree(exhibit) {
    return exhibit.venues[0].galleries[0].floor === "3";
  }

  exhibition = exhibition.filter(notOnFloorThree);

  for (let i = 0; i < exhibition.length; i++){
    // merge fields from exhibtions data with exhibition
    exhibition[i].objectcount = exhibition_size.find(ex => ex.exhibitionid === exhibition[i].exhibitionid).objectcount;
  
    let begin = exhibition[i].begindate.split("-");
    exhibition[i].beginYear = parseInt(begin[0]);
    exhibition[i].beginMonth = parseInt(begin[1]);
    
    let end = exhibition[i].enddate.split("-");
    exhibition[i].endYear = parseInt(end[0]);
    exhibition[i].endMonth = parseInt(end[1]);
  }

  res.render('family-reunion/floor-3', {about: applicationInfo, data: exhibition});
})

router.get('/data', async function(req, res, next) {
  let params =  {
    venue: 'HAM',
    after: 'begindate:2014-11-15',
    size: 100,
    sort : 'chronological'
  };
  let exhibition = await ham.Exhibitions.search(params);
  exhibition = exhibition.records;
  function notOnFloorThree(exhibit) {
    return exhibit.venues[0].galleries[0].floor === "3";
  }

  exhibition = exhibition.filter(notOnFloorThree);
  
  for (let i = 0; i < exhibition.length; i++){
    // merge fields from exhibtions data with exhibition
    let e = exhibition_size.find(ex => ex.exhibitionid === exhibition[i].exhibitionid);
    exhibition[i].objectcount = e.objectcount;
  }

  const structuredData = { name: "Galleries", children: [] };

  exhibition.forEach(exhibit => {
      exhibit.venues.forEach(venue => {
        if (venue.galleries){
          venue.galleries.forEach(gallery => {
              let galleryId = gallery.galleryid;
              let existingGallery = structuredData.children.find(g => g.name === galleryId);
              if (!existingGallery) {
                  existingGallery = { name: galleryId, children: [] };
                  structuredData.children.push(existingGallery);
              }
              let exhibitionSize = exhibit.objectcount;
              existingGallery.children.push({ name: exhibit.title, size: exhibitionSize, begindate: exhibit.begindate, enddate: exhibit.enddate });
          });
      }});
  });
  res.json(structuredData);
})

module.exports = router;