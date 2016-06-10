import React from 'react';
import component from "omniscient";
// import { dom } from 'react-reactive-class';
import most from "most";
import Immutable from "immutable";
// import Waveform from "./waveform";

import logger from "./utils/streamLog";

import {VictoryPie} from "victory";
import transposedNote from "./utils/transposedNote";
import keysToColors from "./api/keysToColors";
import openKeySequence from "./api/openKeySequence.js";

import tinyColor from "tinyColor2";


export default component(props => 
<VictoryPie innerRadius={70} width={280} animate={{velocity:0.02}} data={
    openKeySequence.map(note => ({x:""+note+"/"+transposedNote(note,9)+"m",y:1,fill:tinyColor(keysToColors(transposedNote(note,0))).lighten(10).toHexString()}))
}
style={{labels:{fontWeight:"bold", padding:0,fontSize:"8px",opacity:1, ":hover":{opacity:1}},data:{stroke:"black", strokeWidth:"0.4px",":hover":{stroke:"white", zIndex:999,strokeWidth:"1.5px"}}}}

/>);


export var transposeWheel = component(({baseKey,transposed}) => <VictoryPie innerRadius={110} width={500} data={
    openKeySequence.map(note => ({x:""+note+"/"+transposedNote(note,9)+"m",y:1,fill:tinyColor(keysToColors(transposedNote(note,0))).lighten(20).toHexString()}))
}
style={{labels:{fontWeight:"bold", padding:0},data:{stroke:"transparent"}}}

// style={{
//     data: {
//         fill:  (data) => keysToColors(transposedNote("C",data.x)),
//         stroke: (data) => keysToColors(transposedNote("C",data.x))
//     }  
// }}
/>);
;