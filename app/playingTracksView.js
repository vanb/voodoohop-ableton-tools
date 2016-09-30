import React, {Component} from 'react';

import component from './utils/immComponent';

// import { dom } from 'react-reactive-class';
import {fromEvent} from 'most';
import Immutable from "immutable";

// var ReactiveWaveform = reactive(Waveform);
import keysToColors from "./api/keysToColors";

// import ReactCountdownClock from "react-countdown-clock";

import AudioContainer from "./audioContainer";
// import log from "./utils/streamLog";


var TrackStatistic = component(({fileData, liveData,keyFormatter, isSelected}) => {
  const beatsRemaining = Math.round(liveData.get("end_marker") - liveData.get("playingPosition"));
  // log("showingTrackStatistic")(keyFormatter,liveData);
  return <div className="ui mini statistics inverted right floated tom blackTransparentBg">
    {
      (liveData.get("transposedKey")) ?
        <div className="statistic tom">
          <div className="value" >
            <span style={{ color: keysToColors(liveData.get("transposedKey")) }}>{keyFormatter(liveData.get("transposedKey")) }</span>
            <span style={{ fontSize: "80%" }}>{(liveData.get("pitch") != 0 ? ((liveData.get("pitch") > 0 ? " +" : " ") + `${liveData.get("pitch")}`) : "") }</span>
          </div>
          <div className="label">
            Key
          </div>
        </div>
        : null
    }
    <div className="statistic  tom">
      <div className="value">
        {Math.round(fileData.getIn(["warpMarkers", "baseBpm"])) || fileData.getIn(["id3Metadata", "bpm"]) || "-"}
      </div>
      <div className="label">
        Bpm
      </div>
    </div>
    <div className="statistic  tom">
      <div className="value" style={beatsRemaining < 64 ? { color: "orange", fontWeight: "bold" } : {}} >
        {beatsRemaining}
      </div>
      <div className="label">
        Beats
      </div>
    </div>

  </div>
});


import actionStream from "./api/actionSubject";

import {DraggableParent, DraggableChild, dragEvent} from "./utils/makeDraggableTrack";


actionStream.plug(fromEvent("beginDrag", dragEvent));
actionStream.plug(fromEvent("endDrag", dragEvent));
actionStream.plug(fromEvent("hoverDrag", dragEvent).throttle(20)
  .skipRepeatsWith((a, b) => a.get("targetId") === b.get("targetId"))
);


import {getKeyFormatter} from "./api/openKeySequence";

var Track = component(function ({track, trackId, uiState}) {
		// var track = props.track;	
  // console.log("props",this.props);
		if (!track)
    return <div>no track found</div>;

  // console.log("trackttt",track.toJS());
		var progress = 20;
  var textStyle = {
    'fill': '#ffffff',
    'textAnchor': 'middle'
  };
  if (!track.getIn(["fileData", "waveform"]) && track.getIn(["liveData", "file_path"])) {
    // actionStream.push(Immutable.Map({ type: "loadMetadata", path: track.getIn(["liveData", "file_path"]) }));
    return <div>{"loading"}</div>;
  }

  var grouped = uiState.getIn(["groupedTracks", trackId]);

  var style = { padding: "3px"/*,backgroundColor:"white"*/, boxSizing: "content-box" };
  if (uiState.getIn(["dragState", "hover"]) && uiState.getIn(["dragState", "hover", "sourceId"]) !== trackId)
    style.backgroundColor = "rgba(255,255,255,0.12)"
  if (uiState.getIn(["dragState", "hover", "targetId"]) === trackId && uiState.getIn(["dragState", "hover", "sourceId"]) !== trackId) {
    style.border = "1px dotted white";
    style.backgroundColor = "rgba(255,255,255,0.2)";
  }
  // var audioContainer = ;
  const isSelectedClip = trackId === "selectedClip";
  return this.props.connectDragSource(
    this.props.connectDropTarget(<div className="ui vertical segment inverted" style={style}>
      <div className="image" style={{ position: "relative" }}>
        <div className="content inverted" style={{ position: "absolute", width: "100%" }}>


          {
            track.get("fileData") ? <TrackStatistic isSelected={isSelectedClip} liveData={track.get("liveData") } fileData={track.get("fileData") } keyFormatter={getKeyFormatter(uiState)}/> : ""
          }
          <div className="ui header tom" style={{ fontSize: "3vw", fontWeight: isSelectedClip ? "normal" : "bold" }}><span className="blackTransparentBg">
            {track.getIn(["fileData", "id3Metadata", "artist"]) || track.getIn(["liveData", "name"]) }
          </span>{track.getIn(["liveData","isSelected"]) ? <span style={{color: "#aaa"}}> (selected)</span>:null}</div>
          <span className="blackTransparentBg" style={{
            fontSize: isSelectedClip ? "2vw" : "3vw",
            margin: "0px",
            color: "#aaa"
          }}>{track.getIn(["fileData", "id3Metadata", "title"]) }</span>

        </div><div style={{ paddingTop: "10px", height: "100%" }}>
          <AudioContainer uiState={uiState} trackId={trackId} track={track} />
        </div>

      </div>
    </div>));

});

const DraggableTrack = DraggableChild(Track);

import log from "./utils/streamLog";

var logger = log("playingTracksView");
// var RTrack = reactive(Track);

// import { CardStack, Card } from 'react-cardstack';


const PlayingTracks = component(({availableTracks, uiState}) => {
  // var sortedTracks = availableTracks.keySeq().sort().toArray();
		// logger("thijsTracks", availableTracks,uiState,sortedTracks);
		// var tracks = this.props.tracks;
  // sortedTracks.map(log("trkId"));
		if (!availableTracks)
    return <div>no tracks loaded</div>;
		return <div className="ui inverted divided list" style={{ backgroundColor: "rgba(0,0,0,0)",  webkitAppRegion:"drag"}}>

    {availableTracks.map((track, trackId) => {

      // const track = availableTracks.get(trackId);
      // const isSelectedClip = ;// === availableTracks.getIn(["selectedClip", "liveData", "id"]);// trackId == "selectedClip";
      const isSelectedClip = trackId === "selectedClip";
      const isSelected = track.getIn(["liveData", "isSelected"]);
      const noClipSelected = track.getIn(["liveData", "id"]) === 0;
      // logger("rendering track",track.get("trackId"),track);
      const selectedClipAlreadyDisplayed = track.getIn(["liveData", "selectedClipAlreadyDisplayed"]);
      return <div key={"key_" + trackId}  className="item">

        <div className="content" style={

          {
            marginTop: isSelectedClip ? "5px" : 0,
            borderTop: isSelected && !(isSelectedClip && selectedClipAlreadyDisplayed) ? "0.2px dashed rgba(150,150,150,0.6)" : "none",
            borderBottom: isSelected && !(isSelectedClip && selectedClipAlreadyDisplayed) ? "0.2px dashed rgba(150,150,150,0.6)" : "none"
          }}>
          {
            noClipSelected && isSelectedClip ?
              (<div style={{ width: "100%", textAlign: "center", color: "#aaa" }}>no clip selected</div>)
              : (isSelectedClip && selectedClipAlreadyDisplayed ?
                null : (<DraggableTrack track={track} trackId={trackId} uiState={uiState} />)
              )
          }
        </div>
        </div>;
     
    })} </div>;
});

    export default DraggableParent(PlayingTracks);
