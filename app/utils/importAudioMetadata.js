import Subject from "./subject.js";
// import gen from "../api/audioMetadataGenerator";
import most from "most";
// import {fetchOrProcess} from "../api/db";


import Imm from "immutable";
import actionStream from "../api/actionSubject";

import "../transforms/vampMetadata.js";

import fs from "fs";

import log from "../utils/streamLog";

var taglib = require("thomash-node-audio-metadata");

// var filewalker = require('filewalker');
// require("node-find-files");


var extensions=".mp3,.m4a,.mp4,.aif,.aiff,.wav".split(",");

// var finder = filewalker("/Users/thomash/Documents/organised/electronica",{maxPending:-1});

// import metadataStore from "../store/metadataStore";
  //  .drain();  


var extractMetadata = path => {
  console.log("extracting metadata",path);
  
 var f =new taglib.File(path);
 return most.fromPromise(new Promise((resolve) => f.readTaglibMetadata((res) => {
  //  availableMetadataExtractor.push(extractMetadata);
   res = Imm.fromJS(res);
   if (!res.get("metadata"))
    res = res.set("metadata", Imm.fromJS({title:path.split("/").pop()}));
   console.log("got metadata",res.toJS());
   resolve(res.set("audio",res.get("audio") ? res.get("audio").set("duration", res.getIn(["audio","duration"])/1000):null));
 })));
};

// var promiseGen = toTagStream.map(f =>);44

// var availableMetadataExtractor = Subject(extractMetadata);

// var extractMetadataStreamIn = Subject();



// var extractedMetadata = extractMetadataStreamIn.zip((file, extractor) => new Promise(resolve => extractor(file,resolve)), availableMetadataExtractor).await();

// var metadataStream = fetchOrProcess(toTagStream.map(f =>f[0]), extractMetadata);


import extractWarpMarkers from "../transforms/extractWarpMarkers";



console.log("helllooo");
// finder.startSearch();




import {registerTransform, transforms} from "../api/audioMetadataGenerator";

import {overviewWaveform} from "./thomashWarpWaveform";

import audiobufferPeaks from "./audioBuffer2Peaks";

import "../transforms/streamingAudioToWaveform";

registerTransform({name:"pathStat", depends:["path"], transform: (path) => Imm.fromJS(JSON.parse(JSON.stringify(fs.statSync(path))))});

registerTransform({name: "audioAndId3Metadata", depends:["path","audioStream"], transform: 
    (path,as)=> 
    extractMetadata(path).map(a=>
    {
    console.log("ais",a.toJS());

    return a.updateIn(["audio"],audio=> {
        if (audio===null)
            audio = Imm.Map();
        // console.log("updating in",audio,as);
        return audio.set("duration",as.duration).set("samplerate",as.sampleRate);
     })
    
    })
     
 });

// registerTransform({name: "waveformRange", depends:[], transform: waveform});


registerTransform({name: "audioMetadata", depends:["audioAndId3Metadata"], transform: (m) => m.get("audio") });
registerTransform({name: "id3Metadata", depends:["audioAndId3Metadata"], transform: m=> m.get("metadata") });

registerTransform({name: "warpMarkers", depends:["path","audioMetadata"], transform: extractWarpMarkers });

// registerTransform({name: "overviewWaveform", depends:["path","audioMetadata","id3Metadata","warpMarkers"], transform: overviewWaveform });


console.log("transforms",transforms["path"]);


// .observe(out => console.log("out",Object.keys(out.toJS()))).catch(console.error.bind(console));

// console.log("AudioBuffer", audioBuffer);

var res = (pathInput, requiredData = "warpMarkers") => { 
  // finder.startSearch(); return (toTagStream.map(f=>f[0]).take(100))
  
return transforms[requiredData](pathInput)
.tap(console.log.bind(console))  

// .observe(out => console.log("out",Object.keys(out.toJS()))).catch(console.error.bind(console));


  pathInput
  };
export default res;
