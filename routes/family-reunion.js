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

  // process date below
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

router.get('/floor-3', async function(req, res, next) {
  res.render('family-reunion/floor-3', {about: applicationInfo});
})

router.get('/floor-3-dynamic', async function(req, res, next) {
  res.render('family-reunion/floor-3-dynamic', {about: applicationInfo});
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

  // process and delete the exhibits not on floor 3
  function notOnFloorThree(exhibit) {
    return exhibit.venues[0].galleries[0].floor === "3";
  }
  exhibition = exhibition.filter(notOnFloorThree);
  
  // Loop through each exhibition to merge fields from exhibition_size data
  for (let i = 0; i < exhibition.length; i++){
    // Find the corresponding exhibition size data
    let e = exhibition_size.find(ex => ex.exhibitionid === exhibition[i].exhibitionid);
    // Add the field object count to the exhibition data
    exhibition[i].objectcount = e.objectcount;
  }

  // Initialize a structured data object to organize exhibitions by galleries
  const structuredData = { name: "Galleries", children: [] };

  // Iterate through each exhibition to organize data into structuredData
  exhibition.forEach(exhibit => {
      exhibit.venues.forEach(venue => {
        if (venue.galleries){
          venue.galleries.forEach(gallery => {
              let galleryId = gallery.galleryid;
              // Check if the gallery already exists in structuredData
              let existingGallery = structuredData.children.find(g => g.name === galleryId);
              if (!existingGallery) {
                  // If not, create a new gallery entry
                  existingGallery = { name: galleryId, children: [] };
                  structuredData.children.push(existingGallery);
              }
              let exhibitionSize = exhibit.objectcount;
              // Add the exhibition details to the gallery
              existingGallery.children.push({ name: exhibit.title, size: exhibitionSize, begindate: exhibit.begindate, enddate: exhibit.enddate });
          });
      }});
  });
  res.json(structuredData);
})

module.exports = router;