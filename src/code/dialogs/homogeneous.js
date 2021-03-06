import { WDialog } from "../leafletClasses";
import WasabeePortal from "../portal";
import { getSelectedOperation } from "../selectedOp";
import { greatCircleArcIntersect } from "../crosslinks";
// import WasabeeLink from "../link";
import {
  clearAllLinks,
  getAllPortalsOnScreen,
  testPortal,
} from "../uiCommands";
import wX from "../wX";

const HomogeneousDialog = WDialog.extend({
  statics: {
    TYPE: "HomogeneousDialog",
  },

  addHooks: function () {
    if (!this._map) return;
    // requires newer leaflet, poke user to upgrade their IITC
    if (!this._map.distance) {
      alert("Requires IITC 0.30.1 or newer");
      return;
    }
    this._layerGroup = new L.LayerGroup();
    window.addLayerGroup("Wasabee H-G Debug", this._layerGroup, true);
    this._displayDialog();
  },

  removeHooks: function () {
    window.removeLayerGroup(this._layerGroup);
    WDialog.prototype.removeHooks.call(this);
  },

  _displayDialog: function () {
    if (!this._map) return;

    const container = L.DomUtil.create("div", "container");
    const description2 = L.DomUtil.create("div", "desc", container);
    description2.textContent = wX("H-GEN_INST");
    const anchorDisplay = L.DomUtil.create("span", null, container);
    anchorDisplay.textContent = "";

    const anchorLabelOne = L.DomUtil.create("label", null, container);
    anchorLabelOne.textContent = wX("ANCHOR_PORTAL");
    const anchorButtonOne = L.DomUtil.create("button", null, container);
    anchorButtonOne.textContent = wX("SET");
    this._anchorDisplayOne = L.DomUtil.create("span", null, container);
    if (this._anchorOne) {
      this._anchorDisplayOne.appendChild(
        this._anchorOne.displayFormat(this._smallScreen)
      );
    } else {
      this._anchorDisplayOne.textContent = wX("NOT_SET");
    }
    L.DomEvent.on(anchorButtonOne, "click", (ev) => {
      L.DomEvent.stop(ev);
      this._anchorOne = WasabeePortal.getSelected();
      if (this._anchorOne) {
        localStorage[
          window.plugin.wasabee.static.constants.ANCHOR_ONE_KEY
        ] = JSON.stringify(this._anchorOne);
        this._anchorDisplayOne.textContent = "";
        this._anchorDisplayOne.appendChild(
          this._anchorOne.displayFormat(this._smallScreen)
        );
      } else {
        alert(wX("PLEASE_SELECT_PORTAL"));
      }
    });

    const anchorLabelTwo = L.DomUtil.create("label", null, container);
    anchorLabelTwo.textContent = wX("ANCHOR_PORTAL2");
    const anchorButtonTwo = L.DomUtil.create("button", null, container);
    anchorButtonTwo.textContent = wX("SET");
    this._anchorDisplayTwo = L.DomUtil.create("span", null, container);
    if (this._anchorTwo) {
      this._anchorDisplayTwo.appendChild(
        this._anchorTwo.displayFormat(this._smallScreen)
      );
    } else {
      this._anchorDisplayTwo.textContent = wX("NOT_SET");
    }
    L.DomEvent.on(anchorButtonTwo, "click", (ev) => {
      L.DomEvent.stop(ev);
      this._anchorTwo = WasabeePortal.getSelected();
      if (this._anchorTwo) {
        localStorage[
          window.plugin.wasabee.static.constants.ANCHOR_TWO_KEY
        ] = JSON.stringify(this._anchorTwo);
        this._anchorDisplayTwo.textContent = "";
        this._anchorDisplayTwo.appendChild(
          this._anchorTwo.displayFormat(this._smallScreen)
        );
      } else {
        alert(wX("PLEASE_SELECT_PORTAL"));
      }
    });

    const anchorLabelThree = L.DomUtil.create("label", null, container);
    anchorLabelThree.textContent = wX("ANCHOR_PORTAL3");
    const anchorButtonThree = L.DomUtil.create("button", null, container);
    anchorButtonThree.textContent = wX("SET");
    this._anchorDisplayThree = L.DomUtil.create("span", null, container);
    if (this._anchorThree) {
      this._anchorDisplayThree.appendChild(
        this._anchorThree.displayFormat(this._smallScreen)
      );
    } else {
      this._anchorDisplayThree.textContent = wX("NOT_SET");
    }
    L.DomEvent.on(anchorButtonThree, "click", (ev) => {
      L.DomEvent.stop(ev);
      this._anchorThree = WasabeePortal.getSelected();
      if (this._anchorThree) {
        localStorage[
          window.plugin.wasabee.static.constants.ANCHOR_THREE_KEY
        ] = JSON.stringify(this._anchorThree);
        this._anchorDisplayThree.textContent = "";
        this._anchorDisplayThree.appendChild(
          this._anchorThree.displayFormat(this._smallScreen)
        );
      } else {
        alert(wX("PLEASE_SELECT_PORTAL"));
      }
    });

    const depthLabel = L.DomUtil.create("label", null, container);
    depthLabel.textContent = wX("MAX_SPLITS");
    this.depthMenu = L.DomUtil.create("select", null, container);
    let dc = 2;
    while (dc <= 6) {
      const depthOption = L.DomUtil.create("option", null, this.depthMenu);
      depthOption.value = dc;
      depthOption.textContent = dc;
      dc++;
    } // no need for an event, we will read the value directly below

    L.DomUtil.create("span", "null", container);

    const orderLabel = L.DomUtil.create("label", null, container);
    orderLabel.textContent = "Order";
    this.orderMenu = L.DomUtil.create("select", null, container);
    for (const [text, value] of [
      [wX("FROM_DEPTH"), "core"], // need wX on first column
      [wX("FROM_1-2"), "base12"],
      [wX("FROM_1-3"), "base13"],
      [wX("FROM_2-3"), "base23"],
    ]) {
      const orderOption = L.DomUtil.create("option", null, this.orderMenu);
      orderOption.value = value;
      orderOption.textContent = text;
    }
    L.DomUtil.create("span", "null", container);

    const placeholder = L.DomUtil.create("div", "null", container);
    placeholder.textContent = "\u2063";

    // Go button
    const drawButton = L.DomUtil.create("button", "drawb", container);
    drawButton.textContent = wX("ONION");
    L.DomEvent.on(drawButton, "click", (ev) => {
      L.DomEvent.stop(ev);
      this.hfield.call(this);
    });

    const spanRedraw = L.DomUtil.create("span", "null", container);
    this._redrawButton = L.DomUtil.create("button", null, spanRedraw);
    this._redrawButton.textContent = "Redraw"; // need wX
    this._redrawButton.style.display = "none";
    L.DomEvent.on(this._redrawButton, "click", (ev) => {
      L.DomEvent.stop(ev);
      if (this._tree) this._draw.call(this);
    });

    const buttons = {};
    buttons[wX("CLOSE")] = () => {
      this._dialog.dialog("close");
    };
    buttons[wX("CLEAR LINKS")] = () => {
      this._layerGroup.clearLayers();
      clearAllLinks(getSelectedOperation());
    };

    this._dialog = window.dialog({
      title: "Homogeneous",
      html: container,
      width: "auto",
      dialogClass: "wasabee-dialog wasabee-dialog-homogeneous",
      closeCallback: () => {
        this.disable();
        delete this._dialog;
      },
    });
    this._dialog.dialog("option", "buttons", buttons);
  },

  initialize: function (map = window.map, options) {
    WDialog.prototype.initialize.call(this, map, options);
    this.type = HomogeneousDialog.TYPE;
    this.title = "Homogeneous";
    this.label = "Homogeneous";
    this._operation = getSelectedOperation();
    let p = localStorage[window.plugin.wasabee.static.constants.ANCHOR_ONE_KEY];
    if (p) this._anchorOne = WasabeePortal.create(p);
    p = localStorage[window.plugin.wasabee.static.constants.ANCHOR_TWO_KEY];
    if (p) this._anchorTwo = WasabeePortal.create(p);
    p = localStorage[window.plugin.wasabee.static.constants.ANCHOR_THREE_KEY];
    if (p) this._anchorThree = WasabeePortal.create(p);

    this._urp = testPortal();
    this._failed = 0;
  },

  hfield: function () {
    this._failed = 0;
    this._layerGroup.clearLayers();

    if (!this._anchorOne || !this._anchorTwo || !this._anchorThree) {
      alert("please select three anchors");
      return;
    }

    const portals = new Array();
    for (const p of getAllPortalsOnScreen(this._operation)) {
      if (
        this._fieldCovers(
          this._anchorOne,
          this._anchorTwo,
          this._anchorThree,
          p
        )
      )
        portals.push(p);
    }

    console.time("HF recurser");
    const tree = this._recurser(
      1,
      portals,
      this._anchorOne,
      this._anchorTwo,
      this._anchorThree
    );
    console.timeEnd("HF recurser");

    this._tree = tree;
    this._failed = (3 ** (+this.depthMenu.value - 1) - 1) / 2 - tree.split;

    this._draw();

    if (this._failed > 0) {
      alert(
        `Unable to find ${this._failed} splits, try less depth or a different region`
      );
    }
  },

  _draw: function () {
    this._colors = new Array();
    for (const [k, c] of window.plugin.wasabee.static.layerTypes) {
      if (k != "self-block") this._colors.push(k);
      this._trash = c;
    }

    this._operation.startBatchMode();
    if (this.orderMenu.value == "base12")
      this._drawTreeBase(this._tree, this._anchorOne, this._anchorTwo);
    else if (this.orderMenu.value == "base13")
      this._drawTreeBase(this._tree, this._anchorOne, this._anchorThree);
    else if (this.orderMenu.value == "base23")
      this._drawTreeBase(this._tree, this._anchorTwo, this._anchorThree);
    else this._drawTreeCore(this._tree);
    this._operation.endBatchMode();

    // this._operation.cleanAnchorList();
    // now, remove the portals that are unused
    this._operation.cleanPortalList();

    this._redrawButton.style.display = "";
  },

  _recurser: function (depth, portalsCovered, one, two, three) {
    if (depth >= this.depthMenu.value)
      return { success: true, anchors: [one, two, three], split: 0 };

    // empty tree
    let bestResult = {
      success: false,
      anchors: [one, two, three],
      split: 0,
      portal: null,
      children: null,
    };

    // console.log(depth, "portals in consideration", portalsCovered);

    // build a map of all portals coverd by field one,two,three
    // keyed by distance to the centeroid of the field
    // does this get us much in reality? doesn't seem like it
    const m = new Map();
    const center = this._getCenter(one, two, three);
    for (const p of portalsCovered) {
      if (p == one.id || p == two.id || p == three.id) continue;
      const cDist = this._map.distance(center, p.latLng || p._latlng);
      m.set(cDist, p);
    }
    // sort by distance to centeroid the field
    const sorted = new Map([...m.entries()].sort((a, b) => a[0] - b[0]));
    if (sorted.size == 0) {
      // console.log("empty set");
      return bestResult;
    }

    // find the portal that divides the area into regions with the closest number of portals
    // starts at the center-most and works outwards
    let differential = portalsCovered.length;
    let best = [];
    let bestp = {};
    // for each of the portals in play
    for (const [k, wp] of sorted) {
      // silence lint
      this._trash = k;
      const subregions = this._getSubregions(
        wp,
        new Array(...portalsCovered),
        one,
        two,
        three
      );
      // one of the regions didn't have enough
      // if (!subregions) continue; // never
      // is this one better than the previous?
      // smallest difference in the number of portals between the greatest and least, 0 being ideal
      const temp =
        Math.max(
          subregions[0].length,
          subregions[1].length,
          subregions[2].length
        ) -
        Math.min(
          subregions[0].length,
          subregions[1].length,
          subregions[2].length
        );
      if (temp < differential) {
        best = subregions;
        differential = temp;
        bestp = wp;
      }
      // found one with equal number of portals in all 3, quit digging
      // if (differential == 0) break;
    }

    // console.log("best balance: ", bestp.name, differential, best);
    bestResult.portal = bestp;

    bestResult.children = [
      this._recurser(depth + 1, new Array(...best[0]), one, two, bestp),
      this._recurser(depth + 1, new Array(...best[1]), two, three, bestp),
      this._recurser(depth + 1, new Array(...best[2]), one, three, bestp),
    ];
    bestResult.success =
      bestResult.children[0].success &&
      bestResult.children[1].success &&
      bestResult.children[2].success;
    bestResult.split =
      1 +
      bestResult.children[0].split +
      bestResult.children[1].split +
      bestResult.children[2].split;
    return bestResult;
  },

  _drawTreeCore: function (tree) {
    const depthValue = +this.depthMenu.value - 1;
    const [one, two, three] = tree.anchors;
    const computeDepth = (depth, tree, map) => {
      if (tree.portal) {
        map.set(tree.portal.id, depth);
        for (const child of tree.children) computeDepth(depth + 1, child, map);
      }
    };

    const portalDepth = new Map([
      [one.id, 0],
      [two.id, 0],
      [three.id, 0],
    ]);
    computeDepth(1, tree, portalDepth);

    // the order follows this process (consider only op links)
    // (0) if max depth is 1, goto 7
    // (1) start from maximal depth (D) portals
    // (2) for each portals of depth (D):
    // (3)   link to the _only_ portal deepless by 1 (D-1)
    // (4) for each of the 1 deepless portals:
    // (5)   link to all the deeper portals by _increasing_ depth (D+1, D+2 etc)
    // (6) if D > 1 then goto (1) with D = D-1
    // (7) for each anchor:
    // (8)   deploy it (or don't link it before this step)
    // (9)   link to previous anchors
    // (A)   link to all deeper portals by _increasing_ depth (1, 2 etc)
    const orderByDepth = (a, b) => {
      let ad = portalDepth.get(a.id);
      let bd = portalDepth.get(b.id);

      const baseOrder = ((depthValue - bd) * (depthValue - bd - 1)) / 2 + 1;

      if (bd != 0 || b.id == one.id) return baseOrder + ad - bd - 1;

      if (b.id == two.id) return baseOrder + depthValue + ad;

      return baseOrder + 2 * depthValue + ad + 1;
    };

    const draw = (depth, r) => {
      if (r.portal) {
        const dp = portalDepth.get(r.portal.id);
        for (const anchor of r.anchors) {
          const ap = portalDepth.get(anchor.id);
          const linkID = this._operation.addLink(
            anchor,
            r.portal,
            "intern link",
            orderByDepth(r.portal, anchor)
          );
          if (ap > 0 && dp == ap + 1)
            this._operation.reverseLink(anchor.id, r.portal.id);
          this._operation.setLinkColor(
            linkID,
            this._colors[depth % this._colors.length]
          );
        }
        for (const child of r.children) draw(depth + 1, child);
      }
    };

    const drawDebug = (depth, r) => {
      if (r.portal) for (const child of r.children) drawDebug(depth - 1, child);
      if (!r.portal && !r.success) {
        // debug layer
        const color = depth == 1 ? "orange" : "red";
        const latlngs = [
          r.anchors[0].latLng,
          r.anchors[1].latLng,
          r.anchors[2].latLng,
          r.anchors[0].latLng,
        ];
        const polygon = L.polygon(latlngs, { color: color });
        polygon.addTo(this._layerGroup);
      }
    };
    drawDebug(depthValue, tree);

    this._operation.addPortal(one);
    this._operation.addPortal(two);
    this._operation.addPortal(three);
    this._operation.addLink(
      two,
      one,
      "Outer 1",
      (depthValue * (depthValue - 1)) / 2 + depthValue + 1
    );
    this._operation.addLink(
      three,
      one,
      "Outer 2",
      (depthValue * (depthValue - 1)) / 2 + 2 * depthValue + 2
    );
    this._operation.addLink(
      three,
      two,
      "Outer 3",
      (depthValue * (depthValue - 1)) / 2 + 2 * depthValue + 2
    );
    draw(1, tree);
  },

  _drawTreeBase: function (tree, one, two) {
    const depthValue = +this.depthMenu.value - 1;

    const drawFractal = (depth, r, pOne, pTwo, order) => {
      if (r.portal) {
        // draw inner HF on base 1-2
        const pThree = r.anchors.filter((p) => p != pOne && p != pTwo)[0];
        for (const child of r.children)
          if (!child.anchors.includes(pThree))
            order = draw(depth + 1, child, pOne, pTwo, order);

        let order1, order2;
        // draw fractal on 1-p
        for (const child of r.children)
          if (!child.anchors.includes(pTwo))
            order1 = drawFractal(depth + 1, child, pOne, r.portal, order);

        // draw fractal on 2-p
        for (const child of r.children)
          if (!child.anchors.includes(pOne))
            order2 = drawFractal(depth + 1, child, pTwo, r.portal, order);

        // should be computed with a formula
        order = Math.max(order1, order2);
      }
      return order;
    };

    // link an anchor to inner portals in depth order
    const drawBackLink = (depth, r, anchor, order) => {
      if (r.portal) {
        const linkID = this._operation.addLink(anchor, r.portal, "", order + 1);
        this._operation.setLinkColor(
          linkID,
          this._colors[order % this._colors.length]
        );
        for (const child of r.children)
          if (child.anchors.includes(anchor))
            drawBackLink(depth + 1, child, anchor, order + 1);
      }
      return order + depthValue - depth + 1;
    };

    // draw a HF from base
    const draw = (depth, r, pOne, pTwo, order = 1) => {
      // draw fratal on 1-2
      order = drawFractal(depth, r, pOne, pTwo, order);
      const pThree = r.anchors.filter((p) => p != pOne && p != pTwo)[0];
      // draw outer link
      for (const anchor of [pOne, pTwo]) {
        const linkID = this._operation.addLink(pThree, anchor, "", order + 1);
        this._operation.setLinkColor(
          linkID,
          this._colors[order % this._colors.length]
        );
      }
      if (!r.portal) return order + 1;
      // draw inner link from 3
      return drawBackLink(depth, r, pThree, order + 1);
    };

    const drawDebug = (depth, r) => {
      if (r.portal) for (const child of r.children) drawDebug(depth - 1, child);
      if (!r.portal && !r.success) {
        // debug layer
        const color = depth == 1 ? "orange" : "red";
        const latlngs = [
          r.anchors[0].latLng,
          r.anchors[1].latLng,
          r.anchors[2].latLng,
          r.anchors[0].latLng,
        ];
        const polygon = L.polygon(latlngs, { color: color });
        polygon.addTo(this._layerGroup);
      }
    };
    drawDebug(depthValue, tree);

    for (const p of tree.anchors) this._operation.addPortal(p);
    this._operation.addLink(two, one, "Outer base", 1);
    draw(1, tree, one, two);
  },

  _getSubregions: function (centerPoint, possibles, one, two, three) {
    this._operation.addPortal(centerPoint);

    const possibleExceptAnchors = new Array();
    for (const p of possibles) {
      const guid = p.id || p.options.guid;
      if (
        guid !== centerPoint.id &&
        guid !== one.id &&
        guid !== two.id &&
        guid !== three.id
      )
        possibleExceptAnchors.push(p);
    }

    const onePortals = new Array();
    for (const p of possibleExceptAnchors) {
      if (this._fieldCovers(one, two, centerPoint, p)) onePortals.push(p);
    }

    const twoPortals = new Array();
    for (const p of possibleExceptAnchors) {
      if (this._fieldCovers(two, three, centerPoint, p)) twoPortals.push(p);
    }

    const threePortals = new Array();
    for (const p of possibleExceptAnchors) {
      if (this._fieldCovers(three, one, centerPoint, p)) threePortals.push(p);
    }

    return [onePortals, twoPortals, threePortals];
  },

  _getCenter: function (a, b, c) {
    const A = this._map.project(a.latLng || a._latlng);
    const B = this._map.project(b.latLng || b._latlng);
    const C = this._map.project(c.latLng || c._latlng);

    const point = L.point((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3);
    return this._map.unproject(point);
  },

  _fieldCovers: function (a, b, c, p) {
    const unreachableMapPoint = this._urp;

    const urp = L.polyline([unreachableMapPoint, p.latLng]);
    const lab = L.polyline([a.latLng, b.latLng]);
    const lac = L.polyline([a.latLng, c.latLng]);
    const lbc = L.polyline([c.latLng, b.latLng]);

    let crossings = 0;
    if (greatCircleArcIntersect(urp, lab)) crossings++;
    if (greatCircleArcIntersect(urp, lac)) crossings++;
    if (greatCircleArcIntersect(urp, lbc)) crossings++;
    return crossings == 1; // crossing 0 or 2 is OK, crossing 3 is impossible
  },
});

export default HomogeneousDialog;
