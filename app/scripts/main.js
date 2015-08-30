(function () {


var workerCalls = {};

if (!('crossOrigin' in new Image()) ||
        typeof Uint8ClampedArray === 'undefined' ||
        typeof Worker === 'undefined') {

    document.body.innerHTML = '<div class="icon alert center pad1">This demo doesn\'t work in your browser. ' +
            'Please try viewing it in Chrome, Firefox or Safari.</div>' +
            '<p class="center"><img src="https://i.imgur.com/eq1cm2u.gif" /></p>';
    return;
}

var map = L.map('map',{maxZoom:14}).setView([46.21, 7.311], 12);
var baselayer = L.tileLayer('https://wmts10.geo.admin.ch/1.0.0/ch.swisstopo.swisstlm3d-karte-grau/default/20150401/3857/{z}/{x}/{y}.png', {
maxZoom: 14
});//.addTo(map);

var water = L.tileLayer.canvas();
var elevation, altitude, azimuth, isDrawn, shadows, zFactor;

var elevationDisplayElement = document.getElementById('elevationVal');

water.redrawQueue = [];

var uniqueId = (function () {
    var lastId = 0;
    return function () {
        return ++lastId;
    };
})();

var workers = [];

function updateTile(e) {
    var ctx = contexts[e.data.id],
        imgData = ctx.createImageData(256, 256);

    var shades = new Uint8ClampedArray(e.data.shades);

    imgData.data.set(shades);
    ctx.putImageData(imgData, 0, 0);
}

for (var i = 0; i < 16; i++) {
    workers[i] = new Worker('scripts/worker.js');
    workers[i].onmessage = updateTile;
    workerCalls[i] = 0;
}

map.on('viewreset', function () {
    contexts = {};
    water.redrawQueue = [];
    workers.forEach(function (worker) {
        worker.postMessage('clear');
    });
});


var contexts = {};


water.drawTile = function(canvas, tilePoint, zoom) {
    var demImg = new Image(),
        ctx = canvas.getContext('2d'),
        demCtx, isDrawn, renderedElevation = null,
        id = uniqueId();

    contexts[id] = ctx;

    function redraw() {
        // prepare task for workers
        var transferable = [],
            data = {id: id};
        // check if the dem has to be recalculated
        if (renderedElevation === null) {
            data.raster = demCtx.getImageData(0, 0, 256, 256).data.buffer;
            data.isDrawn = true;
            transferable.push(data.raster);
        }

        data.elevation = elevation;
        var workerIndex = (tilePoint.x%4 + 4*(tilePoint.y)%4);
        workerCalls[workerIndex] += 1;

        workers[workerIndex].postMessage(data, transferable);

        renderedElevation = elevation;
    }

    demImg.onload = function() {
        // onLoad is the non-blocking function that is called when the data is loaded.
        //It is only called once per tile
        console.log('img data loaded')
        // create a new canvas for this tile
        var c = document.createElement('canvas');
        c.width = c.height = 256;
        demCtx = c.getContext('2d');
        // draw image data to canvas
        demCtx.drawImage(demImg, 0, 0);
        // call the redraw function
        redraw();
        // add new tile to queue
        water.redrawQueue.push(redraw);
    };

    demImg.crossOrigin = null;
    demImg.src = L.Util.template(
        // '/tiles/{z}/{x}/{y}.png',
        'http://skyplan.ch/maps/dev/tiles/tiles/{z}/{x}/{y}.png',
        L.extend({z: zoom}, tilePoint));
}
water.redrawTiles = function () {
    console.log('redrawing ' + water.redrawQueue.length + ' tiles')
    // find which tiles are visible

    // redraw tiles in Queue
    water.redrawQueue.forEach(function(redraw) { redraw(); });
};

water.addTo(map);


function get(id) {
    return document.getElementById(id);
}

function updateValues() {
    elevation = parseInt(get('elevation').value);

    elevationDisplayElement.innerHTML = elevation;
}

updateValues();



(function() {
    var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

var needsRedraw = false;

function redraw() {
    if (needsRedraw) {
        water.redrawTiles();
    }
    needsRedraw = false;

    window.requestAnimationFrame(redraw);
}

redraw();

[].forEach.call(document.querySelectorAll('#controls input'), function (input) {
    input['oninput' in input ? 'oninput' : 'onchange'] = function (e) {
        updateValues();
        needsRedraw = true;
    };
});

})();
