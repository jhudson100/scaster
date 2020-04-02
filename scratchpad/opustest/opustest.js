"use strict";

var Module = {
    onRuntimeInitialized: () => {
        console.log("It's up");
        main();
    }
};


let sampleRate = 16000;
let freq = 880;
let seconds = 2;
let numChannels = 1;

function makeBuffer(){
    let tmp = new Float32Array( seconds*sampleRate );
    for(let i=0;i<tmp.length;++i){
        let pos = i/sampleRate * 2.0 * Math.PI * freq;
        let val = Math.sin(pos);
        tmp[i] = val;
        freq+=0.01;
    }
    return tmp;
}

let myHEAP;

function readUint32(ptr){
    let tmp = new Uint32Array( myHEAP.buffer, ptr );
    return tmp[0];
}


function writeUint32(ptr,value){
    let tmp = new Uint32Array( myHEAP.buffer, ptr );
    return tmp[0]=value;
}
function main(){
    let tmp = makeBuffer();
    const OPUS_APPLICATION_VOIP = 2048;
    const OPUS_SET_BITRATE_REQUEST = 4002;
    const OPUS_GET_BITRATE_REQUEST = 4003;
    let opus_encoder_create = Module.cwrap("opus_encoder_create", "number", [ "number","number","number", "number"])
    let opus_encoder_ctl = Module.cwrap("opus_encoder_ctl", "number", ["number","number","number"]);
    let opus_encode_float = Module.cwrap("opus_encode_float", "number", ["number", "array", "number", "array", "number"] );
    
    myHEAP = new Uint8Array( Module.HEAPU8.buffer );
    
    let rv;
    
    //vararg functions don't work in emscripten. Unfortunately, opus_encoder_ctl is a vararg function.
     
    let intPtr = Module._malloc( 4 );
    console.log("intPtr=",intPtr);
    let enc = opus_encoder_create( sampleRate, numChannels, OPUS_APPLICATION_VOIP, intPtr );
    console.log("enc=",enc,"err=",readUint32(intPtr));
    rv = opus_encoder_ctl( enc, OPUS_SET_BITRATE_REQUEST, 4000);
    console.log("set bitrate:",rv);
    rv = opus_encoder_ctl( enc, OPUS_GET_BITRATE_REQUEST, intPtr );
    let theBitRate = readUint32( intPtr );
    console.log("get bitrate: rv=",rv,"bitrate=",theBitRate);
    
    
    rv = opus_encoder_ctl( enc, 4001, intPtr );
    console.log("get app: rv=",rv,"app=",readUint32(intPtr) );



    let msec = 60;
    let numsamps = Math.floor(msec/1000*sampleRate);
    console.log("numsamps=",numsamps);
    let encoded = new Uint8Array(100000);    //FIXME: get better size
    let totalEncoded=0;
    let inFloats = new Float32Array(numsamps);
    let inU8 = new Uint8Array(inFloats.buffer,0);
    for(let i=0;i<tmp.length;i+=numsamps){
        for(let j=0;j<numsamps;++j)
            inFloats[j] = tmp[i+j];
        let p = new Uint8Array( encoded, totalEncoded );
        let numBytes = opus_encode_float( enc, inU8, numsamps, p, p.length );
        console.log(numBytes);
        totalEncoded += numBytes
    }
    console.log("Total bytes:",totalEncoded,"=",totalEncoded/seconds,"bytes/sec");
    Module._free(intPtr);

}
/*
    let enc = opus_encoder_create( sampleRate, 1, OPUS_APPLICATION_VOIP, 
//sample rate must be 8k, 12k, 16k, 24k or 48k
//ok to always choose 48k and let opus handle compression
int err;
OpusEncoder* enc = opus_encoder_create( sampleRate, numChannels, OPUS_APPLICATION_VOIP, &err);
opus_encoder_ctl( enc, OPUS_SET_BITRATE( bitsPerSecond ) );

//to encode frame
//numSamples: Number of floats in array (note: if stereo, 
//  array has 2*numSamples floats)
// Restriction: numSamples must be one Opus frame.
//  An Opus frame is 2.5, 5, 10, 20, 40, or 60 msec of audio
//  ex: At 48kHz sample rate, this must be one of 120,240,480,960,1920,2880
//  ex: At 48kHz sample rate, 10msec = 480 samples
//  Note: At 10msec or less, some compression techniques are not available.
int numBytes = opus_encode_float( 
    enc, pcmDataAsFloatArray, numSamples, outputBuffer, sizeOfOutputBuffer );
Note: If numBytes <= 2, OK to just drop the packet


opus_encoder_destroy(enc)



////////////////
int err;
OpusDecoder* dec = opus_decoder_create( sampleRate, numChannels, &err );

//decode frame:
//frameSize should be at least 120msec = 5760 if 48KHz
//Size of output data: numChannels * frameSize floats
opus_decode_float( dec, dataBuffer, sizeOfDataBuffer, floatArrayOutput, frameSize, useForwardErrorCorrection )

*/



 
function writeChunksToWave( floatBuffers, totalFloats, inputSampleRate ){
    
    let outputSampleRate = 16000;
    let bytesPerSample=1;
    let numChannels=1;
    
    let ratio = inputSampleRate/outputSampleRate;
    let downsampled = new Float32Array( totalFloats / ratio );
    let k=0;
    let sum = 0;
    let nextf = ratio;
    let ctr=0;
    
    console.log(ratio,nextf);
    
    let numAccumulated = 0;
    for(let i=0;i<floatBuffers.length;++i){
        let A=floatBuffers[i];
        for(let j=0;j<A.length;++j){
            sum += A[j];
            ++numAccumulated;
            ++ctr;
            if( ctr >= nextf-1 ){
                downsampled[k++] = sum/numAccumulated;
                sum=0;
                numAccumulated=0;
                nextf+=ratio;
            }
        }
    }
    
    console.log("Went from",totalFloats,"samples to",k,"==",downsampled.length);
    
    //http://www.topherlee.com/software/pcm-tut-wavformat.html
    let out = new Uint8Array(44+downsampled.length);
    let dv = new DataView(out.buffer);
    let i=0
    out[i++] = 82; //R
    out[i++] = 73; //I
    out[i++] = 70; //F
    out[i++] = 70; //F
    dv.setUint32(i,out.length-8,true);
    i+=4;
    out[i++] = 87;  //W
    out[i++] = 65;  //A
    out[i++] = 86;  //V
    out[i++] = 69;  //E
    out[i++] = 102; //f
    out[i++] = 109; //m
    out[i++] = 116; //t
    out[i++] = 32;  //space
    dv.setUint32(i,16,true);
    i+=4;
    dv.setUint16(i,1,true); //PCM
    i+=2;
    dv.setUint16(i,numChannels,true); //mono
    i+=2;
    dv.setUint32(i,outputSampleRate,true); //sample rate
    i+=4;
    dv.setUint32(i,outputSampleRate*bytesPerSample*numChannels,true);    //bytes per second
    i+=4;
    dv.setUint16(i,bytesPerSample*numChannels,true);    //bytes per frame
    i+=2;
    dv.setUint16(i,bytesPerSample*8,true);  //bits per sample
    i+=2;
    out[i++] = 100; //d
    out[i++] = 97;  //a
    out[i++] = 116; //t
    out[i++] = 97;  //a
    dv.setUint32(i,downsampled.length*4,true);
    i+=4;
    for(let k=0;k<downsampled.length;++k){
        let v = (downsampled[k]+1.0)*127;
        if( v < 0 ) v=0;
        if( v > 255) v=255;
        out[i++] = v;
    }
    
    let u = "http://"+document.location.host+"/upload";
    console.log("Sending to",u);
    let xhr = new XMLHttpRequest();
    xhr.addEventListener("load", () => {
        console.log("Uploaded");
    });
    xhr.open("POST", u);
    xhr.send(out);
}
 
