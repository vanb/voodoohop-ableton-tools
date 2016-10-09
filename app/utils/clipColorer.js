import state$ from "../store/combinedState";

import {oscOutput} from "./oscInOut";

import keysToColors from "../api/keysToColors";

import {from as mostFrom} from "most";

import log from "./streamLog";

import {Map, List} from "immutable";

import tinycolor from "tinycolor2";


const calcAbletonRepresentation = ({r,g,b}) => r* (2**16)+g*(2**8)+b;
 
const getAbletonCol = (keyInfo) =>
    calcAbletonRepresentation(tinycolor(keysToColors(keyInfo.get("transposedKey"))).toRgb());


const formatPitch = (pitch) => pitch > 0 ? `+${pitch}` : (pitch<0 ? ""+pitch : "")

const prefix = keyInfo => `[${keyInfo.get("formattedKey")}${formatPitch(keyInfo.get("transpose"))}]`;

const replaceNonAlphaNumeric = n => n.replace(/[^\w\]\[\-_\+\s#\.]/,"");

const alterName = (keyInfo) => 
    replaceNonAlphaNumeric(keyInfo.get("name").match(/^\[(.*)]/) ? keyInfo.get("name").replace(/^\[(.*)]/, prefix(keyInfo))
    : prefix(keyInfo)+" "+keyInfo.get("name"));


// oscOutput.plug(state$
//     .flatMap(state =>
//         most.from(
//             state.get("tracks")
//                 .filter((s,trackId)=> trackId=="selectedClip")
//                 .map((s,trackId) =>
//                 s? Map({ 
//                     transposedKey: s.getIn(["liveData", "transposedKey"]), 
//                     clipId: s.getIn(["liveData", "id"]),
//                     trackId 
//                 }):Map()).toArray()))
//     // .tap(log("clipsWantingToBeColouredFirst"))
//     .filter(s => s && s.get("transposedKey") && s.get("clipId"))

//     .scan((assignedColors, newColor) =>
//         assignedColors.update(newColor.get("trackId"),() => newColor)
//     , Map({}))
//     // )
//     .skipImmRepeats()
//     .debounce(100)
//     .tap(log("clipsWantingToBeColoured"))

//     .flatMap(trackKeys => from(trackKeys.map((keyInfo) =>
//         Map({
//             trackId:keyInfo.get("trackId"),
//             args: List(["color", getAbletonCol(keyInfo)])
//         })
//     ).toArray()))
//     .tap(log("oscClipColorCommand"))
// );


import {getKeyFormatter} from "../api/openKeySequence";


oscOutput.plug(
    state$
    .map(state => state.getIn(["tracks","selectedClip"], Map())
    .set("keyFormatter", getKeyFormatter(state.get("uiState")))
    .set("clipUpdate",state.getIn(["uiState","clipUpdate"]))
    )
    // .map(selectedTrackState => )
    .debounce(100)
    .skipImmRepeats()
    .map(s=>Map({ 
                    transposedKey: s.getIn(["liveData", "transposedKey"]),
                    formattedKey: s.get("keyFormatter")(s.getIn(["liveData", "transposedKey"])), 
                    clipId: s.getIn(["liveData", "id"]),
                    name: s.getIn(["liveData","name"]),
                    transpose: parseInt(s.getIn(["liveData","pitch"])),
                    update:s.get("clipUpdate") 
    }))
    .filter(s => s.get("transposedKey") && s.get("clipId") && s.get("name"))
    .skipImmRepeats()
    .tap(log("selectedClipWantsToBeColorful"))
    
    .flatMap(keyInfo => 
        
        mostFrom([
        keyInfo.getIn(["update","color"]) ? Map({
            trackId:"selectedClip",
            args: List([keyInfo.get("clipId"),"color", getAbletonCol(keyInfo)])
        }) : null, 
        keyInfo.getIn(["update","name"]) ? Map({
            trackId:"selectedClip",
            args: List([keyInfo.get("clipId"),"name", alterName(keyInfo)])
        }):null]
        .filter(f => f!= null)
        ))   
    );

