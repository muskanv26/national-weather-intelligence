const fs = require('fs');
const path = require('path');

const indiaPath = path.join(__dirname, 'india.json');
const maskPath = path.join(__dirname, 'india_mask.json');

const indiaData = JSON.parse(fs.readFileSync(indiaPath, 'utf8'));

const worldRing = [
  [-180, 90],
  [180, 90],
  [180, -90],
  [-180, -90],
  [-180, 90]
];

const polygonCoords = [worldRing];

for (const feature of indiaData.features) {
  const geom = feature.geometry;
  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) {
      polygonCoords.push(ring);
    }
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        polygonCoords.push(ring);
      }
    }
  }
}

const maskGeojson = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "India Mask" },
      geometry: {
        type: "Polygon",
        coordinates: polygonCoords
      }
    }
  ]
};

fs.writeFileSync(maskPath, JSON.stringify(maskGeojson));
console.log("Mask created successfully.");
