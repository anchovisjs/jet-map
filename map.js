mapboxgl.accessToken = 'pk.eyJ1IjoiZ2Vvc2h1ciIsImEiOiJja3ZtaHFxYzUwdmpuMm9vNXM5NGF4c3h4In0.1i6rEonS-ir3dXBhz5PUEw';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11', // 'mapbox://styles/mapbox/streets-v12'  
    center: [ 0, 0],
    zoom: 3,
    projection: 'globe' // naturalEarth 'globe'
});

const COUNTRIES =
        './data/ne_50m_admin_0_countries.geojson'; 
const CITIES =         
        './data/ne_50m_populated_places.geojson';

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

function coord(data) { 
    let arr = [];    
    data.features.forEach(function(feature) {
            var coords = feature.geometry.coordinates;
            arr.push(coords);
    });
    return arr;
};

let response = await window.fetch('./data/ne_50m_populated_places.geojson');

if (response.ok) { 
  let data = await response.json();
  var cities = coord(data);
}; 

map.on('load', () => {

new deck.HexagonLayer({});

var counter = 0;

var n = cities.length;
var origin = cities[getRandomInt(n)];
var destination = cities[counter + getRandomInt(n - counter)];

const route = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'geometry': {
                'type': 'LineString',
                'coordinates': [origin, destination]
            }
        }
    ]
};

const point = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'Point',
                'coordinates': origin
            }
        }
    ]
};

const lineDistance = turf.length(route.features[0]);

const arc = [];
const steps = 500;

for (let i = 0; i < lineDistance; i += lineDistance / steps) {
    const segment = turf.along(route.features[0], i);
    arc.push(segment.geometry.coordinates);
}

route.features[0].geometry.coordinates = arc;

    map.addSource('city', {
        'type': 'geojson',
        'data': CITIES
    });

    map.addSource('country', {
        'type': 'geojson',
        'data': COUNTRIES 
    });

    map.addSource('point', {
        'type': 'geojson',
        'data': point
    });

    map.addSource('route', {
        'type': 'geojson',
        'data': route
    });

    map.addLayer({
        'id': 'country',
        'source': 'country',
        'type': 'line',
        'paint': {
            'line-width': 0.5,
            'line-color': '#d7d7d7'
        }
    });

    map.addLayer({
        'id': 'cities',
        'type': 'circle',
        'source': 'city',
        'paint': {
        'circle-radius': 4,
        'circle-color': '#6C6960',
        }
        });

        map.addLayer({
            'id': 'route',
            'source': 'route',
            'type': 'line',
            'paint': {
                'line-width': 2,
                'line-color': '#007cbf'
            }
        });

    map.addLayer({
        'id': 'point',
        'source': 'point',
        'type': 'symbol',
        'layout': {
            'icon-image': 'airport',
            'icon-size': 2.5,
            'icon-rotate': ['get', 'bearing'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
        }
    });

    let running = false;
    function animate() {
        running = true;
        const start =
            route.features[0].geometry.coordinates[
                counter >= steps ? counter - 1 : counter
            ];
        const end =
            route.features[0].geometry.coordinates[
                counter >= steps ? counter : counter + 1
            ];
        if (!start || !end) {
            running = false;
            document.getElementById('replay').disabled = false;
            return;
        }

        point.features[0].geometry.coordinates =
            route.features[0].geometry.coordinates[counter];

        point.features[0].properties.bearing = turf.bearing(
            turf.point(start),
            turf.point(end)
        );

        map.getSource('point').setData(point);

        if (counter < steps) {
            requestAnimationFrame(animate);
        }

        counter = counter + 1;
    }

    document.getElementById('replay').addEventListener('click', () => {
            origin = destination;
            destination = cities[getRandomInt(n)];

            point.features[0].geometry.coordinates = origin;
            route.features[0].geometry.coordinates = [origin, destination];

            const lineDistance = turf.length(route.features[0]);

            const arc = [];
            const steps = 500;
            
            for (let i = 0; i < lineDistance; i += lineDistance / steps) {
                const segment = turf.along(route.features[0], i);
                arc.push(segment.geometry.coordinates);
            }
            
            route.features[0].geometry.coordinates = arc;

            map.getSource('point').setData(point);
            map.getSource('route').setData(route);

            counter = 0;
            animate(counter);
        // }
    });

    animate(counter);
});
