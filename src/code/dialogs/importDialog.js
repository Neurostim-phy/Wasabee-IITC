import WasabeeOp from "../operation";
import WasabeePortal from "../portal";
import { WDialog } from "../leafletClasses";
import { getSelectedOperation, makeSelectedOperation } from "../selectedOp";
import OperationChecklistDialog from "./operationChecklistDialog";
import wX from "../wX";
// import { pointTileDataRequest } from "../uiCommands";

const ImportDialog = WDialog.extend({
  statics: {
    TYPE: "importDialog",
  },

  initialize: function (map = window.map, options) {
    this.type = ImportDialog.TYPE;
    WDialog.prototype.initialize.call(this, map, options);
  },

  addHooks: function () {
    if (!this._map) return;
    this._autoload = false;
    if (
      localStorage[window.plugin.wasabee.static.constants.AUTO_LOAD_FAKED] ===
      "true"
    ) {
      this._autoload = true;
    }
    WDialog.prototype.addHooks.call(this);
    this._displayDialog();
  },

  removeHooks: function () {
    WDialog.prototype.removeHooks.call(this);
  },

  _displayDialog: function () {
    if (!this._map) return;

    const container = L.DomUtil.create("div", null);
    container.style.width = "420px";

    const nameblock = L.DomUtil.create("span", null, container);
    const label = L.DomUtil.create("label", null, nameblock);
    label.textContent = wX("NAME");
    this._namefield = L.DomUtil.create("input", null, label);
    this._namefield.value = wX("IMPORT_OP") + new Date().toGMTString();
    this._namefield.placeholder = "noodles";
    const note = L.DomUtil.create("span", null, nameblock);
    note.textContent = wX("ONLY_DT_IMP");

    // Input area
    this._textarea = L.DomUtil.create("textarea", null, container);
    this._textarea.placeholder = wX("PASTE_INSTRUCT");

    const buttons = {};
    buttons[wX("OK")] = () => {
      this.importTextareaAsOp();
      this._dialog.dialog("close");
    };
    buttons[wX("GET DT")] = () => {
      this.drawToolsFormat();
    };

    this._dialog = window.dialog({
      title: wX("IMP_WAS_OP"),
      html: container,
      width: "auto",
      dialogClass: "wasabee-dialog wasabee-dialog-import",
      closeCallback: () => {
        this.disable();
        delete this._dialog;
        // XXX is this still necessary?
        const newop = getSelectedOperation();
        window.runHooks("wasabeeUIUpdate", newop);
        window.runHooks("wasabeeCrosslinks", newop);
      },
      id: window.plugin.wasabee.static.dialogNames.importDialog,
    });
    this._dialog.dialog("option", "buttons", buttons);
  },

  drawToolsFormat() {
    const dtitems = localStorage["plugin-draw-tools-layer"];
    if (dtitems) {
      this._textarea.value = dtitems;
    } else {
      this._textarea.placeholder = wX("NO_DT_ITEMS");
    }
  },

  importTextareaAsOp() {
    const string = this._textarea.value;
    if (
      string.match(
        new RegExp("^(https?://)?(www\\.)?intel.ingress.com/intel.*")
      )
    ) {
      alert(wX("NO_STOCK_INTEL"));
      return;
    }

    // check to see if it is drawtools
    if (string.match(new RegExp(".*(polyline|polygon).*"))) {
      console.log("trying to import IITC Drawtools format... wish me luck");

      const newop = this.parseDrawTools(string);
      if (this._namefield.value) {
        newop.name = this._namefield.value;
      } else {
        newop.name = wX("IMPORT_OP_TITLE", new Date().toGMTString());
      }

      // needs to be saved, but not update UI
      newop.store();
      // this updates the UI and runs crosslinks
      makeSelectedOperation(newop.ID);
      // open the checklist to get a pass at loading portals
      // although that is now off-by-default, at least let the user
      // see which portals need attention
      const checklist = new OperationChecklistDialog();
      checklist.enable();
      // zoom to it
      // OR use pointTileDataRequest to try to load faked portals?
      this._map.fitBounds(newop.mbr);

      return;
    }

    // assume a Wasabee op
    try {
      const data = JSON.parse(string);
      const importedOp = WasabeeOp.create(data);
      importedOp.store();
      makeSelectedOperation(importedOp.ID);
      alert(wX("IMPORT_OP_SUCCESS", importedOp.name));
    } catch (e) {
      console.warn("WasabeeTools: failed to import data: " + e);
      alert(wX("IMP_NOPE"));
    }
  },

  parseDrawTools(string) {
    const newop = new WasabeeOp();
    // Don't check crosslink or save on each portal/link add
    newop.startBatchMode();

    let data = null;
    try {
      data = JSON.parse(string);
    } catch (e) {
      console.warn("Failed parseDrawTools: " + e);
      alert(e);
      return null;
    }

    // build a hash map for fast searching of window.portals
    const pmap = this.buildWindowPortalMap();

    let faked = 0;
    let found = 0;
    for (const line of data) {
      if (line.type != "polyline" && line.type != "polygon") continue;

      let prev = false;
      let first = false;

      for (const point of line.latLngs) {
        // use fixed precision
        const truncPoint = {
          lat: point.lat.toFixed(6),
          lng: point.lng.toFixed(6),
        };
        // check the op first
        let portal = newop.getPortalByLatLng(truncPoint.lat, truncPoint.lng);

        // look to see if it is known to IITC
        if (!portal) {
          portal = this.searchWindowPortals(truncPoint, pmap);
          if (portal) {
            newop.addPortal(portal);
            found++;
          }
        }

        // worst case: fake it
        if (!portal) {
          const p = WasabeePortal.fake(truncPoint.lat, truncPoint.lng);
          newop.addPortal(p);
          portal = p;
          faked++;
        }
        if (portal && prev) {
          newop.addLink(prev, portal);
        }
        prev = portal;
        if (!first) first = portal;
      }
      if (line.type == "polygon" && first && prev && first != prev) {
        newop.addLink(prev, first);
      }
    }
    alert(
      wX("IMP_COMP") + found + wX("PORT_FAKE") + faked + wX("USE_SWAP_INSTRUCT")
    );

    // get the op out of batchmode, but do not update UI or run crosslinks yet
    newop._batchmode = false;
    return newop;
  },

  // build a fast lookup map of known portals
  buildWindowPortalMap() {
    const pmap = new Map();
    for (const portalID in window.portals) {
      const ll = window.portals[portalID].getLatLng();
      const key = ll.lat.toFixed(6) + "/" + ll.lng.toFixed(6);
      pmap.set(key, portalID);
    }
    return pmap;
  },

  searchWindowPortals(latLng, pmap) {
    const key = latLng.lat + "/" + latLng.lng;
    if (pmap.has(key)) {
      const portalID = pmap.get(key);
      const np = WasabeePortal.fake(latLng.lat, latLng.lng, portalID);
      return np;
    }
    return false;
  },
});

export default ImportDialog;
