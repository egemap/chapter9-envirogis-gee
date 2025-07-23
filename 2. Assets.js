// ===== CREATION OF ASSETS =====
// Authors: María Teresa González-Moreno, Casandra Muñoz-Gómez, Laura Cambronero-Ruiz

Map.setOptions('HYBRID'); // Map display mode
// Geometry of the study area
var geometry = ee.Geometry.Polygon([
    [-4.400430, 36.902031], // Northwest corner
  [-4.400430, 36.894640], // Southwest corner
  [-4.379582, 36.894640], // Southeast corner
  [-4.379582, 36.902031], // Northeast corner
  [-4.400430, 36.902031]  // Closing point (same as line 7)
]);
// Create a FeatureCollection from the polygon
var table = ee.FeatureCollection([ee.Feature(geometry)]);
// Center the map on the study area
Map.centerObject(table); 

// ===== Creation of image collections =====
// Create Sentinel-2 image collection for September 9, 2024
var Sep09 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
              .select('B.*') 
              .filterBounds(geometry)
              .filterDate('2024-09-07','2024-09-10') 
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
              .sort('CLOUDY_PIXEL_PERCENTAGE')
              .map(function(img){
                return img.clip(geometry);
              });
              
// Create Sentinel-2 image collection for February 6, 2025
var Feb06 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
              .select('B.*') 
              .filterBounds(geometry)
              .filterDate('2025-02-05','2025-02-07') 
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
              .sort('CLOUDY_PIXEL_PERCENTAGE')
              .map(function(img){
                return img.clip(geometry);
              });
              
print("Available images for Sep09:", Sep09)
print("Available images for Feb06:", Feb06)

// ===== RGB, NDVI and NDMI calculations =====
// Create an RGB composite
var addRGB = function(image) {
  var rgb = image.select(['B4', 'B3', 'B2']);
  return image.addBands(rgb);
};

var Sep09 = Sep09.map(addRGB);
var Feb06 = Feb06.map(addRGB);

//Función para calcular y agregar una banda NDVI y NDMI
var addIndices = function(image) {
  var ndvi = image.normalizedDifference(['B8','B4']). rename('NDVI');
  var ndmi = image.normalizedDifference(['B8','B11']). rename ('NDMI')
  return image.addBands([ndvi, ndmi]);
};
// Apply addRGB function to both image collections
var Sep09 = Sep09.map(addIndices);
var Feb06 = Feb06.map(addIndices);

// Extract median composites of NDVI and NDMI for both dates
var NDVImed_S = Sep09.select('NDVI').median();
var NDVImed_F = Feb06.select('NDVI').median();
var NDMImed_S = Sep09.select('NDMI').median();
var NDMImed_F = Feb06.select('NDMI').median();

// ===== Exporting images as assets =====
// Export RGB median composite for September
Export.image.toAsset({
  image: Sep09.median().select(['B4','B3','B2']),
  description: 'RGB_Sep09',
  assetId: 'users/user/RGB_Sep09_viewer',
  region: geometry,
  scale: 10,
  maxPixels: 1e13
});
// Export RGB median composite for February
Export.image.toAsset({
  image: Feb06.median().select(['B4','B3','B2']),
  description: 'RGB_Feb06',
  assetId: 'users/user/RGB_Feb06_viewer',
  region: geometry,
  scale: 10,
  maxPixels: 1e13
});
// Export median NDVI image for September
Export.image.toAsset({
  image: NDVImed_S,
  description: 'NDVI_Sep09',
  assetId: 'users/user/NDVI_Sep09_viewer',
  region: geometry,
  scale: 10,
  maxPixels: 1e13
});
// Export median NDVI image for February
Export.image.toAsset({
  image: NDVImed_F,
  description: 'NDVI_Feb06',
  assetId: 'users/user/NDVI_Feb06_viewer',
  region: geometry,
  scale: 10,
  maxPixels: 1e13
});
// Export median NDMI image for September
Export.image.toAsset({
  image: NDMImed_S,
  description: 'NDMI_Sep09',
  assetId: 'users/user/NDMI_Sep09_viewer',
  region: geometry,
  scale: 10,
  maxPixels: 1e13
});
// Export median NDMI image for February
Export.image.toAsset({
  image: NDMImed_F,
  description: 'NDMI_Feb06',
  assetId: 'users/user/NDMI_Feb06_viewer',
  region: geometry,
  scale: 10,
  maxPixels: 1e13
});


// If you use or refer to this material, please cite the original book chapter:
// González-Moreno, M.T., Muñoz-Gómez, C., & Cambronero-Ruiz, L. (2025).
// The use of GEE to assess land use changes and vegetation status in human-affected areas.
// In EnviroGIS, Elsevier (DOI when available).
