var express = require('express');
var router = express.Router();
let HAM = require('@harvardartmuseums/ham');
let exhibition_size = require('../data/exhibition_size');
let nlp = require('compromise');

let applicationInfo = {
  title: 'Family Reunion',
  description: 'Three galleries in ten years'
};

let ham = new HAM(process.env.HAM_APIKEY);

async function fetchExhibitions() {
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
    let image = await ham.Images.get(exhibition[i].images[0].imageid);
    if (image.colors) {

      let steps = [];
      let stop = 0;

      let max = 0;
      image.colors.forEach(c => {
          c.percentScaled = Math.floor(c.percent*1000000);
          max += c.percentScaled;
      });
      image.colors.forEach(c => {
          c.percentRounded = Math.floor(Math.abs((((c.percentScaled - 0) * (100 - 1)) / (max - 0)) + 1));
          // colors.map(c => (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin; )

          let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c.color);
          c.r = parseInt(result[1], 16);
          c.g = parseInt(result[2], 16);
          c.b = parseInt(result[3], 16)        
      });
      image.colors.forEach((c, i) => {    
        if (i>0) stop += Math.round(image.colors[i-1].percentRounded);
        // a stupid hack to clamp the percents at the upper end between 1 and 100
        if (stop>=90) stop = stop - (stop - 100 + (image.colors.length-i)) + 1;
        steps.push(`rgba(${c.r},${c.g},${c.b},1) ${stop}%`);
      })  
      image.gradient = `linear-gradient(90deg, ${steps.toString()})`;      
    }
    exhibition[i].poster.details = image; 

    let begin = exhibition[i].begindate.split("-");
    exhibition[i].beginYear = parseInt(begin[0]);
    exhibition[i].beginMonth = parseInt(begin[1]);
    
    let end = exhibition[i].enddate.split("-");
    exhibition[i].endYear = parseInt(end[0]);
    exhibition[i].endMonth = parseInt(end[1]);

    let doc = nlp(exhibition[i].description);
    exhibition[i].lead = doc.sentences(0).text();
    exhibition[i].verbs = doc.verbs().out('freq');
    exhibition[i].nouns = doc.nouns().out('freq');
    exhibition[i].adjectives = doc.adjectives().out('freq');
  }

  // process and delete the exhibits not on floor 3
  function notOnFloorThree(exhibit) {
    return exhibit.venues[0].galleries[0].floor === "3";
  }
  return exhibition.filter(notOnFloorThree);
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  res.render('family-reunion/index', { about: applicationInfo });
});

router.get('/poster/v:v', async function(req, res, next) {
  let exhibitions = await fetchExhibitions();

  let view = 'family-reunion/poster';
  if (req.params.v > 1) {
    view = `family-reunion/poster-v${req.params.v}`;
  }
  res.render(view, {layout: 'layout-family-reunion.hbs', about: applicationInfo, data: exhibitions});
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
    before: "begindate:2024-06-01",
    size: 600,
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
    console.log(exhibition[i].exhibitionid)
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