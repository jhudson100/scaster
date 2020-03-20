"use strict";


function main(){
    let floatBuffers=[];
    let totalFloats=0;
    navigator.mediaDevices.getUserMedia( {audio: true} ).then(
        (strm) => {
            let tracks = strm.getAudioTracks();
            let track = tracks[0];
            let ctx = new AudioContext();
            let sampleRate = ctx.sampleRate;
            let start = Date.now();
            let last = start;
            let totalSamples=0;
            let sproc = ctx.createScriptProcessor( 2048, 1, 0 );
            sproc.addEventListener( "audioprocess", (ev) => {
                let f32 = ev.inputBuffer.getChannelData(0);
                //~ console.log(f32);
                floatBuffers.push(f32);
                totalFloats+=f32.length;
                let now = Date.now();
                let deltaT = now-last;
                last=now;
                totalSamples += f32.length;
                //~ console.log(totalSamples*1000/(now-start),"samples/sec avg");
                if( now - start > 1000 ){
                    console.log("Stopping");
                    track.enabled=false;
                    track.stop();
                    ctx.suspend();
                    writeChunksToWave(floatBuffers,totalFloats, sampleRate);
                }
            });
            let S = ctx.createMediaStreamTrackSource(track);
            S.connect(sproc);
        }
    ).catch( ( e ) => {
        console.log("Error:",e);
    });
}

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

//cpu usage is a bit high; latency is large (~1 second between events that actually
//yield data instead of empty blob's)
function main1(){
    navigator.mediaDevices.getUserMedia( {audio: true} ).then(
        (strm) => {
            let tracks = strm.getAudioTracks();
            let track = tracks[0];
            let recorder = new MediaRecorder(strm, {
                mimeType: 'audio/ogg;codecs="opus"',
                audioBitsPerSecond: 44100
            });
            let start = Date.now();
            let last=Date.now();
            recorder.addEventListener( "dataavailable", (ev) => {
                let blob = ev.data;
                if( blob.size === 0 )
                    return;
                let now = Date.now();
                console.log("size=",blob.size, "time=",now-last );
                last=now;
                if( now-start > 10000 ){
                    console.log("That's long enough. Stopping");
                    recorder.stop();
                    track.enabled=false;
                }
                return;
            });
            recorder.start(100);
        }
    ).catch( ( e ) => {
        console.log("Error:",e);
    });
}

main();
