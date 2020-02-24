import { generateId } from "./auxiliar";

export default class WasabeeMarker {
  constructor(type, portalId, comment) {
    this.ID = generateId();
    this.portalId = portalId;
    this.type = type;
    this.comment = comment;
    this.state = "pending";
    this.completedBy = ""; // should be GID, requires change on the server
    this.assignedTo = "";
    this.order = 0;
  }

  get opOrder() {
    return this.order;
  }

  set opOrder(o) {
    this.order = Number.parseInt(o, 10);
  }

  static create(obj) {
    if (obj instanceof WasabeeMarker) {
      console.log("do not call Marker.create() on a Marker");
      console.log(new Error().stack);
      return obj;
    }

    const marker = new WasabeeMarker(obj.type, obj.portalId, obj.comment);
    marker.state = obj.state ? obj.state : "pending";
    marker.completedBy = obj.completedBy ? obj.completedBy : "";
    marker.assignedTo = obj.assignedTo ? obj.assignedTo : "";
    marker.order = obj.order ? obj.order : 0;
    return marker;
  }

  get icon() {
    if (!window.plugin.wasabee.static.markerTypes.has(this.type)) {
      this.type = window.plugin.wasabee.static.constants.DEFAULT_MARKER_TYPE;
    }
    const marker = window.plugin.wasabee.static.markerTypes.get(this.type);
    let img = marker.markerIcon.default;
    switch (this.state) {
      case "pending":
        img = marker.markerIcon.default;
        break;
      case "assigned":
        img = marker.markerIconAssigned.default;
        break;
      case "completed":
        img = marker.markerIconDone.default;
        break;
      case "acknowledged":
        img = marker.markerIconAcknowledged.default;
        break;
    }
    return img;
  }
}
