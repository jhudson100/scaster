/*
Copyright 2020 J Hudson

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/


let http = require("http");
let fs = require("fs");
let path = require("path");

const port=2020;
const serverRoot = path.resolve(process.cwd()); //__dirname
const mimeTypes = {
    "txt": "text/plain",
    "html": "text/html",
    "png": "image/png",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "js": "application/javascript",
    "wasm": "application/wasm"
};

function main(){
    let srv = http.createServer();
    srv.on("request", handleRequest);
    console.log(`Server root = ${serverRoot}`);
    console.log(`Listening on port ${port}`);
    srv.listen(port,"127.0.0.1");
}

function handleRequest(req,resp){
    let url = new URL( req.url, "http://"+req.headers.host);
    
    if( req.method === "GET" )
        handleGet(url,req,resp);
    else if( req.method === "POST" )
        handlePost(url,req,resp);
    else
        error(500,resp,url.pathname,"Bad method");
}
     
function handlePost(url,req,resp){
    log("POSTed data");
    let fp = fs.createWriteStream("uploaded");
    req.pipe(fp);
}

function handleGet(url,req,resp){
    let p = url.pathname;
        
    if( p === "/:file:" ){
        serveSVG(resp,"file svg", file_svg);
        return;
    }
    if( p === "/:folder:" ){
        serveSVG(resp,"folder svg", folder_svg);
        return;
    }
    
    if( !p.startsWith("/") )
        p="/"+p;
    p = serverRoot+p;
    p = path.resolve(p);
    
    if( !p.startsWith(serverRoot) ){
        error(403,resp,url.pathname,p,"Forbidden");
        return;
    }
    if( !fs.existsSync(p) ){
        error(404,resp,p,"Not found");
        return;
    }
    fs.stat( p, (err,stat) => {
        if( err ){
            error(500,resp,p,err);
            return;
        }
        
        if( stat.isDirectory() ){
            serveDirectory(resp,p);
        }
        else{
            serveFile(resp,p);
        }
    });
}

function serveSVG( resp, msg, data ){
    log(msg,"(internal SVG) OK");
    resp.writeHead(200,{"Content-type":"image/svg+xml"});
    resp.end(data);
}

function log(){
    let L=[];
    for(let i=0;i<arguments.length;++i){
        L.push( ""+arguments[i] );
    }
    console.log(L.join(" "));
}

function error(code,resp){
    resp.writeHead(code,{"Content-type":"text/html"});
    resp.end();
    let tmp = [];
    for(let i=2;i<arguments.length;++i)
        tmp.push( ""+arguments[i]);
    log(tmp.join(" "));
    return;
}
function serveDirectory( resp, p ){
    fs.readdir(p, (err,files) => {
        if(err){
            error(500,resp,p,err);
            return;
        }
        log(p,"OK");
        resp.writeHead(200,{"Content-type":"text/html"});
        resp.write('<!DOCTYPE html>\n<HTML><head><meta charset="utf-8"></head><body>');
        resp.write("<ul>");
        files.forEach( (fname) => {
            let fullpath = path.resolve(p+"/"+fname);
            fullpath = fullpath.substring( serverRoot.length+1 );
            let stat = fs.statSync( fullpath );
            let svg;
            if( stat.isDirectory() )
                svg = "/:folder:";
            else
                svg = "/:file:";
            let encoded = encodeURI(fullpath);
            let i = fullpath.lastIndexOf("/");
            let shortpath = fullpath.substring(i+1); //works if i==-1 or if i !== -1
            resp.write(`<img style='width:1.0em; vertical-align: middle; padding: 0.15em;' src='${svg}'>`);
            resp.write(`<a href="${encoded}">${shortpath}</a>`);
            resp.write("<br />");
        });
        resp.end("</ul></body></html>");
    });
}

function serveFile( resp, p ){
    //filename based mimetyping
    let mimeType = "application/octet-stream";
    let i = p.lastIndexOf(".");
    if( i !== -1 ){
        let suffix = p.substring(i+1);
        if( mimeTypes[suffix]  )
            mimeType = mimeTypes[suffix];
    }
    
    //we assume the file is small enough to buffer in memory
    fs.readFile( p, null, (err,data) => {
        if( err ){
            error(500,resp,p,err);
            return;
        }
        log(p,"OK ("+mimeType+")");
        resp.writeHead(200,{"Content-type": mimeType });
        resp.end(data);
    });
    
}


main();



const file_svg='<svg width=".437in" height=".594in" version="1.1" viewBox="0 0 11.1 15.1" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-23.5 -137)" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="5" stroke-width=".529"><path d="m23.8 137v14.6h10.6v-11.9h-2.65v-2.65z" fill="#fff" stroke="#000" style="paint-order:normal"/><g fill="#59a2ce" stroke="#51b7ca"><path d="m25.1 142h7.94" style="paint-order:normal"/><path d="m25.1 145h7.94" style="paint-order:normal"/><path d="m25.1 148h7.94" style="paint-order:normal"/><path d="m25.1 150h7.94" style="paint-order:normal"/><path d="m25.1 140h7.94" style="paint-order:normal"/></g><path d="m31.8 137v2.65h2.65z" fill="#c9c9c9" stroke="#000" style="paint-order:normal"/></g></svg>'
const folder_svg='<svg width=".646in" height=".594in" version="1.1" viewBox="0 0 16.4 15.1" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-30.7 -147)" stroke="#081619" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="5" stroke-width=".529"><path d="m34.1 149c-0.304 0.0138-0.545 7e-3 -0.545 7e-3v12.7h13.2v-12.7h-7.94v-1.82h-4.76c0 0.364 0.0162 1.81 0.0162 1.81z" fill="#d6cbaa" style="paint-order:normal"/><path d="m46.8 162s-1.32-10.9-2.65-10.9h-13.2c1.32 0 2.65 10.9 2.65 10.9z" fill="#ebe6d6" style="paint-order:normal"/></g></svg>'
