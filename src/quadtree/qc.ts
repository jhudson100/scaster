//quadtree compression

declare var require:any;
declare var Buffer:any;
let fs = require("fs");

class TruecolorImage{
    width: number;
    height: number;
    data: any;
    constructor(w:number, h:number, d: any){
        this.width=w;
        this.height=h;
        this.data=d;
    }
}


class PaletteImage{
    width: number;
    height: number;
    data: Uint8Array;
    constructor(w:number, h:number, d: Uint8Array){
        this.width=w;
        this.height=h;
        this.data=d;
    }
}

//for testing
function loadPPM(fname: string){
    let buffer = fs.readFileSync(fname);
    let i=0;
    function next(){
        let j=i;
        while(i < buffer.length && buffer[i] !== 32 && buffer[i] !== 10 ){
            i++;
        }
        i++;
        let tmp = buffer.slice(j,i);
        let st = tmp.toString();
        return st;
    }
    let magic = next();
    let width = parseInt(next(),10);
    let height = parseInt(next(),10);
    let ccv = next();
    return { width: width, height: height, data: buffer.slice(i) };
}


//for testing
function writePPM(fname: string, img: TruecolorImage){
    let hdr = Buffer.from( `P6 ${img.width} ${img.height} 255\n` );
    let output = Buffer.concat( [hdr,img.data] );
    fs.writeFileSync(fname,output);
}

function palettize(I: TruecolorImage){
    let indexed = new Uint8Array( I.width*I.height );
    for(let i=0,j=0;i<I.data.length;){
        let r = I.data[i++];
        let g = I.data[i++];
        let b = I.data[i++];
        r = Math.floor( (r+21)/42); 
        g = Math.floor( (g+21)/42); 
        b = Math.floor( (b+21)/42); 
        if( r > 5 ) r = 5;
        if( g > 5 ) g = 5;
        if( b > 5 ) b = 5;
        let idx = r*36+g*6+b;
        indexed[j++] = idx;
    }
    return new PaletteImage(I.width,I.height,indexed); 
}

function unpalettize(P: PaletteImage ){
    let B = Buffer.alloc(P.width*P.height*3);
    for(let i=0,j=0;j<P.data.length;){
        let idx = P.data[j++];
        let b = idx % 6;
        b *= 42;
        idx = Math.floor(idx/6);
        let g = idx % 6
        g *= 42;
        idx = Math.floor(idx/6);
        let r = idx;
        r *= 42;
        B[i++] = r;
        B[i++] = g;
        B[i++] = b;
    }
    return new TruecolorImage(P.width,P.height,B);
}

function main(){
    let I = loadPPM("images/image1.ppm");
    let P = palettize(I);
    let I2 = unpalettize(P);
    writePPM( "test.ppm",I2);
}

main();


