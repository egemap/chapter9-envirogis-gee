// ===== CREATION OF MULTITEMPORAL AND MULTIVARIABLE GIF =====
// Authors: María Teresa González-Moreno, Casandra Muñoz-Gómez, Laura Cambronero-Ruiz

Map.setOptions('HYBRID');

// Define the study area geometry (a rectangular polygon)
var geometry = ee.Geometry.Polygon([
  [[-4.38404, 36.90168],  // Southwest corner
   [-4.39500, 36.90168],  // Northwest corner
   [-4.39500, 36.89500],  // Northeast corner
   [-4.38400, 36.89500],  // Southeast corner
   [-4.3840, 36.90168]]   // Closing point (same as line 3)
]);

var table = ee.FeatureCollection([ee.Feature(geometry)]); // Convert to FeatureCollection

// Load images previously exported to Assets
var rgbSep = ee.Image('projects/ndvi-carcava/assets/RGB_Septiembre_2024');
var rgbFeb = ee.Image('projects/ndvi-carcava/assets/RGB_Febrero_2025');
var ndviSep = ee.Image('projects/ndvi-carcava/assets/NDVI_Septiembre_2024');
var ndviFeb = ee.Image('projects/ndvi-carcava/assets/NDVI_Febrero_2025');
var ndmiSep = ee.Image('projects/ndvi-carcava/assets/NDMI_Septiembre_2024');
var ndmiFeb = ee.Image('projects/ndvi-carcava/assets/NDMI_Febrero_2025');

// Define clipping region from one of the images
var region = rgbSep.geometry();

// Calculate real min and max values of NDVI
var combinedNDVI = ndviSep.addBands(ndviFeb);
var statsNDVI = combinedNDVI.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: geometry,
  scale: 10,
  maxPixels: 1e9,
  bestEffort: true
});
print('NDVI min/max:', statsNDVI);

// Calculate real min and max values of NDMI
var combinedNDMI = ndmiSep.addBands(ndmiFeb);
var statsNDMI = combinedNDMI.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: geometry,
  scale: 10,
  maxPixels: 1e9,
  bestEffort: true
});
print('NDMI min/max:', statsNDMI);


// Visualization parameters
var rgbVis = {
  min: 0,
  max: 3000,
  bands: ['b1', 'b2', 'b3']  // These correspond to RGB bands
};

var ndviVis = {
  min: -0.015805210918188095,
  max: 0.9547953605651855,
  palette: ['#d73027','#f46d43','#fee08b','#d9ef8b','#66bd63','#1a9850']
};

var ndmiVis = {
  min: -0.28840014338493347,
  max: 0.4207739233970642,
  palette: ['#a6611a', '#dfc27d', '#f7f7f7', '#80cdc1', '#018571']
};

// Apply visualization styles (converts them into RGB-renderable images)
var rgbSepVis = rgbSep.visualize(rgbVis);
var rgbFebVis = rgbFeb.visualize(rgbVis);
var ndviSepVis = ndviSep.visualize(ndviVis);
var ndviFebVis = ndviFeb.visualize(ndviVis);
var ndmiSepVis = ndmiSep.visualize(ndmiVis);
var ndmiFebVis = ndmiFeb.visualize(ndmiVis);

// List of styled images
var images = [
  rgbSepVis,
  rgbFebVis,
  ndviSepVis,
  ndviFebVis,
  ndmiSepVis,
  ndmiFebVis
];

// Convert the list into an ImageCollection (required for video export)
var gifCollection = ee.ImageCollection(images);

// Export as a video (e.g. for visualization as a GIF or MP4)
Export.video.toDrive({
  collection: gifCollection,
  description: 'VegetationChange_RGB_NDVI_NDMI',
  folder: 'GEE_Exports',
  dimensions: 600,
  region: geometry,
  framesPerSecond: 1
});


// If you use or refer to this material, please cite the original book chapter:
// González-Moreno, M.T., Muñoz-Gómez, C., & Cambronero-Ruiz, L. (2025).
// The use of GEE to assess land use changes and vegetation status in human-affected areas.
// In EnviroGIS, Elsevier (DOI when available).
