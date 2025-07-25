// ===== MULTITEMPORAL AND MULTISPECTRAL SATELLITE IMAGE VIEWER =====
// Authors: María Teresa González-Moreno, Casandra Muñoz-Gómez, Laura Cambronero-Ruiz

// Creation of two maps
var Map1 = ui.Map();
var Map2 = ui.Map();

// Geometry of the study area
var geometry = ee.Geometry.Polygon([
  [-4.400430, 36.902031], // Northwest corner
  [-4.400430, 36.894640], // Southwest corner
  [-4.379582, 36.894640], // Southeast corner
  [-4.379582, 36.902031], // Northeast corner
  [-4.400430, 36.902031]  // Closing point (same as line 7)
]);

// Visualization parameters for RGB
var visRGB = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000, gamma: 1.4};

// Loading of images from Assets
// Images from September 09
var assetsSep = {
  'RGB (Sep09)': ee.Image('users/user/RGB_Sep09_viewer'), // RGB
  'NDVI (Sep09)': ee.Image('users/user/NDVI_Sep09_viewer'), // NDVI
  'NDMI (Sep09)': ee.Image('users/user/NDMI_Sep09_viewer') // NDMI
};
// Images from February 06
var assetsFeb = {
  'RGB (Feb06)': ee.Image('users/user/RGB_Feb06_viewer'), // RGB
  'NDVI (Feb06)': ee.Image('users/user/NDVI_Feb06_viewer'), // NDVI
  'NDMI (Feb06)': ee.Image('users/user/NDMI_Feb06_viewer') // NDMI
};

// Creation of dynamic legend panel
var legendPanel = ui.Panel({
  style: {
    padding: '8px 15px', // Internal spacing
    backgroundColor: 'white' // Panel background
  }
});

// ===== FUNCTION TO CREATE LEGENDS =====
function createLegend(title, palette, min, max) {
  var panel = ui.Panel(); // Empty panel to build the legend
// Addition of title label
  panel.add(ui.Label({
    value: title,
    style: {fontWeight: 'bold', fontSize: '14px', margin: '0 0 6px 0'}
  }));
// Creation of a row in the legend with color and value
  var makeRow = function(color, value) {
    var colorBox = ui.Label('', {
      backgroundColor: color,
      padding: '8px',
      margin: '0 4px 0 0'
    });
    var label = ui.Label(value, {margin: '0 0 4px 0', fontSize: '12px'});
    return ui.Panel({widgets: [colorBox, label], layout: ui.Panel.Layout.Flow('horizontal')});
  };
// Creation of a row for each color in the palette
  var n = palette.length;
  for (var i = 0; i < n; i++) {
    var labelVal = (min + (i * (max - min) / (n - 1))).toFixed(2);
    panel.add(makeRow(palette[i], labelVal));
  }
  return panel; // Return legend panel
}

// ===== FUNCTION TO GET DYNAMIC MIN/MAX FOR LEGEND =====
function getMinMax(img1, img2, geometry, callback) {
  // Get the name of the first band from the first image
  var bandName = img1.bandNames().get(0);
  // Combination of the images from the two dates into a single multi-band image
  var combined = img1.addBands(img2);
   // Compute the minimum and maximum values across both images for the selected area
  combined.reduceRegion({
    reducer: ee.Reducer.minMax(), // Use reducer to get min and max
    geometry: geometry, // Area over which to compute stats
    scale: 10, // Resolution (in meters per pixel)
    maxPixels: 1e9, // Maximum number of pixels allowed for the operation
    bestEffort: true // Automatically adjust scale if necessary
  }).evaluate(function(stats) {
    // Retrieve band names from each image (assumed to be the same)
    var band1 = img1.bandNames().getInfo()[0];
    var band2 = img2.bandNames().getInfo()[0];
    // Get the min and max values for each image
    var min1 = stats[band1 + '_min'];
    var max1 = stats[band1 + '_max'];
    var min2 = stats[band2 + '_min'];
    var max2 = stats[band2 + '_max'];
    // Compute the overall min and max across both images
    var minVal = Math.min(min1, min2);
    var maxVal = Math.max(max1, max2);
    // Pass the result to the callback function
    callback({min: minVal, max: maxVal});
  });
}

// ===== FUNCTION TO UPDATE MAP CONTENT =====
function updateMap(map, imageDict, selectedKey) {
  map.layers().reset(); // Remove previous layers
  legendPanel.clear(); // Clear existing legend

  var keyStr = String(selectedKey); // Convert the selected key to a string (for consistency)
  var image = imageDict[keyStr]; // Get image fron dictionary
  // Check if the key refers to an NDVI image
  if (keyStr.indexOf('NDVI') !== -1) {
    // Dynamically compute the min and max values from both dates
    getMinMax(assetsSep['NDVI (Sep09)'], assetsFeb['NDVI (Feb06)'], geometry, function(range) {
      // Visualization parameters
      var visParamsNDVI = {
        min: range.min, // Calculated minimum value
        max: range.max, // Calculated maximum value
        palette: ['#d73027', '#f46d43', '#fee08b', '#d9ef8b', '#66bd63', '#1a9850'] // Color palette
      };
      // Add the image to the map, clipped to the study area
      map.addLayer(image.clip(geometry), visParamsNDVI, keyStr);
      // Add the corresponding legend to the panel
      legendPanel.add(createLegend('NDVI', visParamsNDVI.palette, visParamsNDVI.min, visParamsNDVI.max));
    });
  // Check if the key refers to an NDMI image
  } else if (keyStr.indexOf('NDMI') !== -1) {
    getMinMax(assetsSep['NDMI (Sep09)'], assetsFeb['NDMI (Feb06)'], geometry, function(range) {
      var visParamsNDMI = {
        min: range.min,
        max: range.max,
        palette: ['#a6611a', '#dfc27d', '#f7f7f7', '#80cdc1', '#018571']
      };
      map.addLayer(image.clip(geometry), visParamsNDMI, keyStr);
      legendPanel.add(createLegend('NDMI', visParamsNDMI.palette, visParamsNDMI.min, visParamsNDMI.max));
    });
  // If the key doesn't match NDVI or NDMI, assume it is an RGB image
  } else {
    map.addLayer(image.clip(geometry), visRGB, keyStr);
  }
}

// ======= SELECTORS AND CONTROL PANEL =========
var simpleItems = ['RGB', 'NDVI', 'NDMI']; // Options
var selectLeft = ui.Select({
  items: simpleItems, // Dropdown values
  value: 'RGB', // Default value
  onChange: function(simpleKey) {
    var fullKey = simpleKey + ' (Sep09)'; // Append date
    updateMap(Map1, assetsSep, fullKey); // Update map 1
  }
});
var selectRight = ui.Select({
  items: simpleItems, // Dropdown values
  value: 'RGB', // Default value
  onChange: function(simpleKey) {
    var fullKey = simpleKey + ' (Feb06)'; // Append date
    updateMap(Map2, assetsFeb, fullKey); // Update map 2
  }
});

// ===== INFORMATION PANEL ON TOP-LEFT =====
var infoPanel = ui.Panel({
  widgets: [
    ui.Label('Study Area: Casabermeja', {fontWeight: 'bold'}),
    ui.Label('Dates: Sep 9, 2024 / Feb 6, 2025'),
    ui.Label('Available Layers:'),
    ui.Label('- Natural color: RGB'),
    ui.Label('- Vegetation Index: NDVI'),
    ui.Label('- Moisture Index: NDMI')
  ],
  style: {
    position: 'top-left',
    padding: '10px',
    backgroundColor: 'white',
    width: '250px',
    margin: '0 0 10px 0'
  }
});
Map1.add(infoPanel);

// ===== LAYER CONTROL PANEL =====
var controlPanel = ui.Panel({
  widgets: [
    ui.Label('Left Panel (Sep 2024):'),
    selectLeft,
    ui.Label('Right Panel (Feb 2025):'),
    selectRight
  ],
  style: {position: 'top-left'}
});
Map1.add(controlPanel);

// ===== BOTTOM LEFT PANEL: LEGEND + CENTER BUTTON =====
// Button to center the map
var resetButton = ui.Button({
  label: 'Center View',
  onClick: function() {
    Map1.centerObject(geometry, 17);
  }
});
resetButton.style().set({
  margin: '0 0 0 10px'
});

var bottomLeftPanel = ui.Panel({
  widgets: [legendPanel, resetButton],
  layout: ui.Panel.Layout.Flow('horizontal'),
  style: {
    position: 'bottom-left',
    padding: '8px 15px',
    backgroundColor: 'white'
  }
});
Map1.add(bottomLeftPanel);

// ===== LINK MAPS AND ENABLE SPLIT VIEW =====
var linker = ui.Map.Linker([Map1, Map2]); // Synchronize interactions
var splitPanel = ui.SplitPanel({
  firstPanel: Map1, // Left panel
  secondPanel: Map2, // Right panel
  orientation: 'horizontal',
  wipe: true // Enable swipe interaction
});

ui.root.widgets().reset([splitPanel]); // Reset main UI to use split panel
Map1.centerObject(geometry, 17); // Initial zoom

// Initialize with RGB images
updateMap(Map1, assetsSep, 'RGB (Sep09)');
updateMap(Map2, assetsFeb, 'RGB (Feb06)');


// If you use or refer to this material, please cite the original book chapter:
// González-Moreno, M.T., Muñoz-Gómez, C., & Cambronero-Ruiz, L. (2025).
// The use of GEE to assess land use changes and vegetation status in human-affected areas.
// In EnviroGIS, Elsevier (DOI when available).
