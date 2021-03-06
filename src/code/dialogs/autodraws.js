import { WDialog } from "../leafletClasses";
import wX from "../wX";
import MultimaxButtonControl from "../dialogs/multimaxDialog";
import FanfieldDialog from "../dialogs/fanfield";
import StarburstDialog from "../dialogs/starburst";
import OnionfieldDialog from "../dialogs/onionfield";
import HomogeneousDialog from "../dialogs/homogeneous";
import MadridDialog from "../dialogs/madrid";

// This file documents the minimum requirements of a dialog in wasabee
const AutodrawsDialog = WDialog.extend({
  // not strictly necessary, but good style
  statics: {
    TYPE: "autodraws",
  },

  initialize: function (map = window.map, options) {
    this._map = map;
    this.menuItems = [
      {
        text: wX("MM"),
        callback: () => {
          this._dialog.dialog("close");
          const mm = new MultimaxButtonControl(this._map);
          mm.enable();
        },
      },
      {
        text: wX("MAX"),
        callback: () => {
          this._dialog.dialog("close");
          const ff = new FanfieldDialog(this._map);
          ff.enable();
        },
      },
      {
        text: wX("STARBURST"),
        callback: () => {
          this._dialog.dialog("close");
          const sb = new StarburstDialog(this._map);
          sb.enable();
        },
      },
      {
        text: wX("ONION_WAS_TAKEN"),
        callback: () => {
          this._dialog.dialog("close");
          const o = new OnionfieldDialog(this._map);
          o.enable();
        },
      },
      {
        text: wX("HG"),
        callback: () => {
          this._dialog.dialog("close");
          const h = new HomogeneousDialog(this._map);
          h.enable();
        },
      },
      {
        text: wX("MADRID_WAS_TAKEN"),
        callback: () => {
          this._dialog.dialog("close");
          const m = new MadridDialog(this._map);
          m.enable();
        },
      },
    ];

    this.type = AutodrawsDialog.TYPE;
    WDialog.prototype.initialize.call(this, map, options);
  },

  addHooks: function () {
    WDialog.prototype.addHooks.call(this);
    if (this._smallScreen) {
      this._displaySmallDialog();
    } else {
      this._displayDialog();
    }
  },

  removeHooks: function () {
    WDialog.prototype.removeHooks.call(this);
  },

  _displayDialog: function () {
    const html = L.DomUtil.create("div", "container");
    for (const i of this.menuItems) {
      const link = L.DomUtil.create("a", null, html);
      link.href = "#";
      link.textContent = i.text;
      L.DomEvent.on(link, "click", L.DomEvent.stopPropagation)
        .on(link, "mousedown", L.DomEvent.stopPropagation)
        .on(link, "dblclick", L.DomEvent.stopPropagation)
        .on(link, "click", L.DomEvent.preventDefault)
        .on(link, "click", i.callback, this);
    }

    const buttons = {};
    buttons[wX("OK")] = () => {
      this._dialog.dialog("close");
    };

    this._dialog = window.dialog({
      title: wX("AUTODRAWS"),
      html: html,
      width: "auto",
      dialogClass: "wasabee-dialog wasabee-dialog-autodraws",
      closeCallback: () => {
        this.disable();
        delete this._dialog;
      },
      id: window.plugin.wasabee.static.dialogNames.autodraws,
    });
    this._dialog.dialog("option", "buttons", buttons);
  },

  _displaySmallDialog: function () {
    this._displayDialog();
  },
});

export default AutodrawsDialog;
