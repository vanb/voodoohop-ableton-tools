

// var lame = require('lame');

var fs = require("fs");
var Immutable = require("immutable");

// var WaveformData = require("waveform-data");
import doThePeaks from "./doThePeaks.js";
import most from "most";


import AudioReader from "../lib/audioreader.js";

import {registerTransform} from "../api/audioMetadataGenerator";

// import WarpAdaptorCreator from "./warpWaveformDataAdaptor.js";
// console.log("wfdata",WaveformData.builders);
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var audioElements = {};

import {AIFFDecoder} from "../lib/audiofile";

var shell = require('shelljs');

export function getWebAudioBuffer(path) {
// return 	pathStream.map(path => {

		if (path.trim().toLowerCase().indexOf(".aif")>0) {
			return most.fromPromise(new Promise(resolve => {
				shell.exec("rm /tmp/decoded.wav", () =>
				shell.exec("ffmpeg -i \""+path+"\" /tmp/decoded.wav", (res)=> {console.log("reser",res); resolve(getWebAudioBuffer("/tmp/decoded.wav"))})
				);
			})).flatMap(p => p)//.flatMap(p=>p);

		}
		// 	return most.of(new Promise((resolve,reject)=> fs.readFile(path,"utf8",(err,data)=>{
		// 		console.log("calling decoder in 5s for data:", data.length); 
		// 		setTimeout(()=>resolve(new AIFFDecoder().decode(data)),10);
				
		// 		}))).await();

	console.log("getStreamWaveform", path);
	var offlineAudioCtx = new OfflineAudioContext(1, 1, 11025);
	// var audioCtx


	var readStream = new Promise((resolve,reject) => fs.readFile(path, (err,data) => err ? reject(err):resolve(data)));
	
	var audioBuffer = most.fromPromise(readStream)
		// .tap(b => console.log("audiobuffer1",b))

	// .scan((chunks,chunk) => Buffer.concat([chunks,chunk]), new Buffer([])).skip(5)
	.flatMap(chunk => {
		//console.log("chunk",chunk); 
		return most.fromPromise(AudioReader(new Uint8Array(chunk).buffer, offlineAudioCtx)).map(b => b.buffer || b)
	   .tap(b => console.log("audiobuffer",b));
	})//new Promise((resolve,reject) => offlineAudioCtx.decodeAudioData(new Uint8Array(chunk).buffer,resolve,reject))})
	//.observe(chunk => console.log("chunk",chunk)).catch(e => console.error(e));
// .await()
	
	// console.log("ab",audioBuffer);
	return new Promise(resolve => audioBuffer.observe(res => resolve(res)));
// })
};



registerTransform({name: "audioBuffer", depends:["path"], transform: getWebAudioBuffer});


var _ = require("lodash");
// var MediaStreamRecorder = require("msr");






registerTransform({name: "audioStream", depends:["audioBuffer"], transform: buffer => {
	console.log("sending buffer",buffer);//,buffer.channels[0].length);
	if (buffer.channels) {
		buffer.getChannelData = (i) => {
			var c = buffer.channels[i];
			var downSampled = [];
			for (var j=0;j<c.length;j+=8)
				downSampled.push(c[j]);
			return downSampled;
			//  buffer.channels[i].reduce((downSampled, sample, i)=>i % 8 === 0 ? downSampled.concat([sample]):downSampled,[]);;
		}
		buffer.duration = buffer.length/buffer.sampleRate;
		buffer.sampleRate=buffer.sampleRate/8;
	
	}
	if (!buffer.getChannelData)
		return ({
			buffer:[],
			duration:-500,
			offset:0
		});
	return ({
		buffer:buffer.getChannelData(0),
	duration:buffer.duration|| (buffer.length/buffer.sampleRate), 
	offset: 0, sampleRate: 
	buffer.sampleRate});
	}});

import {warpMarkerReverseMap, warpMarkerBeatMap, timeToBeatWarper} from "./warpMarkerMapper";

registerTransform({name: "timeToBeat", depends: ["warpMarkers"], transform: timeToBeatWarper});

import lodash from "lodash";

function split(a, n) {
    var len = a.length,out = [], i = 0;
    while (i < len) {
        var size = Math.ceil((len - i) / n--);
        out.push(a.slice(i, i += size));
    }
    return out;
}

function resample(a,noSamples, mult=1) {
	console.log("resampling",a.length/noSamples,noSamples);
 var res = split(a, noSamples).map(b => mult*Math.sqrt(b.reduce(function(a,m,i,p) {
    return a + (m*m);
},0)/b.length));
console.log("resampling res",res);
	return res;
}

function warpMap(buffer,warpMarkers) {
	return new Promise((resolve,reject) => {
		console.log("buffer",buffer,warpMarkers);
		
	if (warpMarkers.get("error"))
		reject("warpMarkers not present");
	var fm = warpMarkers.get("warpMarkers").first();
	var lm = warpMarkers.get("warpMarkers").last();
	warpMarkerReverseMap(most.from(warpMarkers.get("warpMarkers")))
		(most.from(Immutable.Range(fm.get("desttime"),lm.get("desttime"), (lm.get("desttime")-fm.get("desttime"))/buffer.buffer.length)))
	.collect()
		.then(warpedTimes => {
			var newBuffer=[];
			// var lastWarpedBeat=-1;
			// var lastBufferIndex=-1;
			// var lastTime=-1;
			console.log("warpedTimes",warpedTimes);
			var warpedDuration = warpedTimes[warpedTimes.length-1]/1000;
			warpedTimes.forEach((t,i) => {
				t=t/1000;
			var interpolatedIndex = Math.floor(buffer.buffer.length*t/warpedDuration);
			var sampleVal  = interpolatedIndex >=0 && interpolatedIndex < buffer.buffer.length ? buffer.buffer[interpolatedIndex] : [0];
			// var warpedTime = t/1000;
			// var interpTime = (buffer.buffer.length*())/buffer.duration;
				// lastWarpedBeat= warpMarkers.get("baseBpm") * interpTime/60;
				// lastTime = interpTime;
				// lastBufferIndex = i;
				// console.log(i,t,interpTime); 
				newBuffer[i] = sampleVal; });
			console.log("wms",warpMarkers.toJS());
			var pixelsPerBeat = buffer.buffer.length/warpMarkers.get("durationBeats");
			warpMarkerBeatMap(most.from(warpMarkers.get("warpMarkers")))
				(most.of(0)).take(1).observe(firstBeat => {console.log("firstBeat",firstBeat); resolve({pixelsPerBeat,waveform:newBuffer, firstBeat: (firstBeat), duration: warpedDuration})})
			
		}, error => console.error("warpedTimesError",error))
	// return buffer;
	});
}

import Subject from "../utils/subject";

registerTransform({name: "waveform", depends:["path","audioStream","warpMarkers"], transform: (path,audioStream,warpMarkers) => {
//   console.log("AUDIOSTREAM",audioStream);
  
  return most.fromPromise(warpMap({buffer: split(audioStream.buffer,2048), duration: audioStream.duration},warpMarkers))
//   .map((v,i) => )
//   .map(n => warpMap(n,warpMarkers))

  .map(w => {
	  console.log("w",w);
 	 return w.waveform.reduce((minmax,n,pos) => {
		//  if (n.length===0)
		//  	return minmax;
	//   var mappedPos = warpMap()
	  minmax.min.push(lodash.min(n)); 
	  minmax.max.push(lodash.max(n));
	  minmax.size = pos+1;
	  return minmax;
  
  },{min:[],max:[], pixelsPerBeat: w.pixelsPerBeat, firstBeat: w.firstBeat, path})})
//   .map(n => ({min: warpMap(n.min)}))
.tap(n => console.log("precalculated",n))
  .map( n =>  {
	//   var resampledMin = resample(n.min, 4096,-1);
	//   var resampledMax = resample(n.max, 4096);
	  return Immutable.fromJS(n);//{min: resampledMin, max: resampledMax, pixelsPerBeat: n.pixelsPerBeat* resampledMin.length/n.max.length, firstBeat: n.firstBeat * resampledMin.length/n.min.length})
  })

  .tap(n => console.log("calculated",n.toJS()))//.map(n => Immutable.fromJS(n));//(new Immutable.Range(audioMetadata.get("duration")*audioMetadata.get("sample_rate")));
  .flatMapError(e => Immutable.fromJS({error:"no warpMarkers saved"}))
}});
