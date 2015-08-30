function raster2dem(data) {

    var dem = new Float32Array(256 * 256);

    var i, j;

    for (var x = 0; x < 256; x++) {
        for (var y = 0; y < 256; y++) {
            i = x + y * 256;
            j = i * 4;
            dem[i] = data[j]/100 + data[j + 1]*1 + data[j + 2]*100;
        }
    }

    
    return dem;
}


function hillshade(dem, waterElevation) {


    var px = new Uint8ClampedArray(256 * 256 * 4),
        waterDepth, alpha, hasInfo = false;

        var i;


    for (var x = 0; x < 256; x++) {
        for (var y = 0; y < 256; y++) {


            i = x + y * 256;

            waterDepth = waterElevation-dem[i];

            if (waterDepth > 0) {
                alpha = Math.min(waterDepth*5+100,255);
                hasInfo = true;
            }else{
                alpha = 0;
            }

            i = i*4;
            
            // color calculator
            px[i]     = 0;
            px[i + 1] = 0;
            px[i + 2] = 255;
            px[i + 3] = alpha;

        }
    }
    if(hasInfo){
        return px;
    }else{
        return false;
    }
    
}
