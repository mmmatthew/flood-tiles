importScripts('hillshade.js');

self.dems = {};

onmessage = function (e) {
    if (e.data === 'clear') {
        self.dems = {};
        return;
    }

    if (e.data.raster) {
        // recalculate the dem if the data has raster data to process
        
        // self.dems = {};
        var raster = new Uint8ClampedArray(e.data.raster);
        self.dems[e.data.id] = raster2dem(raster);
    }

        var waterCover = hillshade(self.dems[e.data.id], e.data.elevation);
        
    if(waterCover){
        // return data to tile draw function
        postMessage({
            id: e.data.id,
            shades: waterCover.buffer
        }, [waterCover.buffer]);
    }
    
};
