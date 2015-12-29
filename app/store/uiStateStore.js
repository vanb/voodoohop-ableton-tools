import Immutable from "immutable";


import actionStream from "../api/actionSubject";


import {oscInputStream} from "../utils/oscInOut";

import logger from "../utils/streamLog";

// oscInputStream.

		
var oscControlInput = oscInputStream.filter(f=> f[0] === "control").map(f => Immutable.fromJS({type: f[1], value:f[2]}))
	.tap(f=>console.log("oscControl",f.toJS()));

actionStream.plug(oscControlInput);

var visibleBeatsZoomedOut = 1024;

var initialState = Immutable.Map({visibleBeats:visibleBeatsZoomedOut/2, groupedTracks: Immutable.Set()});

var toggle = (set,member) => set.contains(member) ? set.remove(member):set.add(member);

export default actionStream//.filter(a=> a.get("type") === "globalZoom" || a.get("type") === "groupButtonClicked")

.scan((store,input) => 
// input.get("trackId") ? store.mergeIn([input.get("trackId")], input) : 
// store.set(input.get("type"), input.get("value"))
input.get("type")==="globalZoom" ? 
store.set("visibleBeats", input.get("value")*(visibleBeatsZoomedOut-4)+4):
(input.get("type")==="groupButtonClicked" ? store.set("groupedTracks", toggle(store.get("groupedTracks"),input.get("trackId")))  : store)
, initialState).startWith(initialState)
.skipRepeats()
.tap(logger("uiState"));