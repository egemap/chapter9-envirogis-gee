// ===== RGB AND INDICES GENERATION =====
// Authors: María Teresa González-Moreno, Casandra Muñoz-Gómez, Laura Cambronero-Ruiz

Map.setOptions('HYBRID');  //Set the map background
var geometry = ee.Geometry.Polygon([   
    [[-4.38404, 36.90168],   //Southwest corner
   [-4.39500, 36.90168],     //Northwest corner
   [-4.39500, 36.89500],     //Northeast corner
   [-4.38400, 36.89500],     //Southeast corner
   [-4.38404, 36.90168]]     //Closing point (same as line 3)
]);

var table = ee.FeatureCollection([ee.Feature(geometry)]); //Create de FeatureCollection

//Create Sentinel2 image collection for September 9, 2024
var Sep09 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")  //Load the satellite image collection from Sentinel 2
              .select('B.*')                                // Select all the satellite's optical bands
              .filterBounds(geometry)                       // Filter by area 
              .filterDate('2024-09-07','2024-09-10')        // Filter by date range
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))  // Filter by cloudy coverage
              .sort('CLOUDY_PIXEL_PERCENTAGE')               // Order by lowest cloud cover
              .map(function(img){
                return img.clip(geometry);                  // Clip each image to our defined geometry
              });
              
//Create Sentinel 2 image collection for February 6, 2025
var Feb06 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
              .select('B.*') 
              .filterBounds(geometry)
              .filterDate('2025-02-05','2025-02-07') 
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
              .sort('CLOUDY_PIXEL_PERCENTAGE')
              .map(function(img){
                return img.clip(geometry);
              });
              
print("Available images:", Sep09) //Show the available images in the collection
print("Available images:", Feb06) //Show the available images in the collection

//RGB composition and spectral indices NDVI y NDMI

//Function to create RGB
var addRGB = function(image) {   //Define a function to add RGB bands
  var rgb = image.select(['B4', 'B3', 'B2']); //Select Red Green and Blue (RGB) bands
  return image.addBands(rgb);    //Add the RGB bands to the image
};

var Sep09 = Sep09.map(addRGB);   //Apply the addRGB function to each image
var Feb06 = Feb06.map(addRGB);   // in our date-filtered collection

//Calculation of spectral indices NDVI and NDMI 
var addIndices = function(image) {  //Define a function to spectral indices
  var ndvi = image.normalizedDifference(['B8','B4']). rename('NDVI');  //Calculate NDVI using B8 Near-Infrarred (NIR) and B4 (Red)
  var ndmi = image.normalizedDifference(['B8','B11']). rename ('NDMI') //Calculate NDMI using B8 Near-Infrarred (NIR)
  return image.addBands([ndvi, ndmi]); //Add the calculations to the image       //and B11 Short-Wave Infrared (SWIR)
};

var Sep09 = Sep09.map(addIndices);       //Apply the addIndices function to each image
var Feb06 = Feb06.map(addIndices);       // in our date-filtered collection

//Extracts the NDVI and NDMI band and creates an NDVI median composite image

//NDVI
var NDVImed_S = Sep09.select('NDVI').median();    //Select our NDVI band from the collection 
var NDVImed_F = Feb06.select('NDVI').median();    //      and calculate the median

//NDMI
var NDMImed_S = Sep09.select('NDMI').median();    //Select our NDMI band from the collection 
var NDMImed_F = Feb06.select('NDMI').median();    //      and calculate the median

//Reduce the region to calculate the minimum and maximum of our geometry

var NDVIStats_S = NDVImed_S.reduceRegion({ ///Applies a spatial reduction to the image using a reducer
  reducer: ee.Reducer.minMax(),   //Reduce the minimum and maximum pixel values to our image 
  geometry: geometry,        //Zone to which the reduction of values will be applied
  scale: 10,                //Spatial resolution for sampling
});

var NDVIStats_F = NDVImed_F.reduceRegion({
  reducer: ee.Reducer.minMax(),            //The steps are repeated for the different dates
  geometry: geometry,
  scale: 10,
});
 
var NDMIStats_S = NDMImed_S.reduceRegion({
  reducer: ee.Reducer.minMax(),            //The steps are repeated for the different dates
  geometry: geometry,
  scale: 10,
});

var NDMIStats_F = NDMImed_F.reduceRegion({
  reducer: ee.Reducer.minMax(),            //The steps are repeated for the different dates
  geometry: geometry,
  scale: 10,
});

//Visualization RGB, NDVI and NDMI

//RGB
var rgbVis = { //We declare a specific variable for the visualization of the RGB composition
  min:0,    //Set the minimum value  
  max: 3000,  //Set the maximum value
  bands:['B4','B3','B2']  //Select the RGB bands to display
};

//NDVI
NDVIStats_S.evaluate(function(statsNDVI_S) { //Converts object (statsNDVI_S) to real JavaScript data
  var ndviVis09 = {       //Set a new variable
    min: statsNDVI_S.NDVI_min, //Minimun real value for NDVI
    max:statsNDVI_S.NDVI_max, //Minimun real value for NDVI
    palette: ['#d73027', '#f46d43', '#fee08b', '#d9ef8b', '#66bd63', '#1a9850'] //Select colors
  };
  Map.addLayer(NDVImed_S, ndviVis09, 'NDVI-Septiembre'); //Add an image to the map, visualization parameters
});                                                      // and name of the layer

NDVIStats_F.evaluate(function(statsNDVI_F) {
  var ndviVis06 = {
    min: statsNDVI_F.NDVI_min,                      //The steps are repeated for the different dates
    max:statsNDVI_F.NDVI_max,
    palette: ['#d73027', '#f46d43', '#fee08b', '#d9ef8b', '#66bd63', '#1a9850']
  };
  Map.addLayer(NDVImed_F, ndviVis06, 'NDVI-Febrero');    //Add an image to the map, visualization parameters
});                                                      // and name of the layer

//NDMI
NDMIStats_S.evaluate(function(statsNDMI_S) { //Converts object (statsNDMI_S) to real JavaScript data
  var ndmiVis09 = {       //Set a new variable
    min: statsNDMI_S.NDMI_min, //Minimun real value for NDMI
    max: statsNDMI_S.NDMI_max, //Minimun real value for NDMI
    palette: ['#a6611a', '#dfc27d', '#f7f7f7', '#80cdc1', '#018571']
  };
  Map.addLayer(NDMImed_S, ndmiVis09, 'NDMI-Septiembre'); //Add an image to the map, visualization parameters
});                                                      // and name of the layer

NDMIStats_F.evaluate(function(statsNDMI_F) {
  var ndmiVis06 = {
    min: statsNDMI_F.NDMI_min,                      //The steps are repeated for the different dates
    max: statsNDMI_F.NDMI_max,
    palette: ['#a6611a', '#dfc27d', '#f7f7f7', '#80cdc1', '#018571']
  };
  Map.addLayer(NDMImed_F, ndmiVis06, 'NDMI-Febrero'); //Add an image to the map, visualization parameters
});                                                   // and name of the layer

//Maps
Map.centerObject(geometry,16);   //Center the map and add zoom
Map.addLayer(Sep09.median().clip(geometry),rgbVis, 'RGB Sep09'); //Set a layer with the RGB composition, its median 
Map.addLayer(Feb06.median().clip(geometry),rgbVis, 'RGB Feb06'); //its clip, visualization parameters and a new name
Map.addLayer(table.draw({color:'black'}), {}, 'Study Area'); //Establish a layer with the delimitation of the study area


// If you use or refer to this material, please cite the original book chapter:
// González-Moreno, M.T., Muñoz-Gómez, C., & Cambronero-Ruiz, L. (2025).
// The use of GEE to assess land use changes and vegetation status in human-affected areas.
// In EnviroGIS, Elsevier (DOI when available).
