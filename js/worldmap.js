/* Era of Empires - interactive SVG world map (World Power style).
 *
 * Renders country shapes as SVG paths (converted from the World Power
 * countries-110m TopoJSON) inside an equirectangular viewBox.
 * Supports zoom (wheel) and pan (drag), hover tooltips, click-to-select
 * and flag markers - all in vanilla JS, no build step.
 */
import { WORLD_COUNTRIES, MAP_W, MAP_H } from './world-map-paths.js';

const MIN_W = 300;
const MAX_W = 2600;
const ASPECT = MAP_H / MAP_W;

export class WorldMap {
  constructor(container, { onSelect = () => {}, onHover = () => {} } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.onHover = onHover;

    // per-code ownership from the API: { owner, ownerUsername }
    this.ownership = {};
    this.me = null;
    this.selectedCode = null;
    this.hoverCode = null;

    // viewBox state (equirectangular projection, viewBox 0 0 1000 505)
    this.vb = { x: 0, y: 0, w: MAP_W, h: MAP_H };
    this._drag = { active: false, start: null };

    this._build();
    this._bindEvents();
    this.render();
  }

  _build() {
    this.container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'map-viewport';
    wrap.style.cssText =
      'position:relative;overflow:hidden;background:#0b1026;cursor:grab;touch-action:none;';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.cssText = 'width:100%;height:100%;display:block;';
    this.svg = svg;

    this.viewportG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(this.viewportG);

    // ocean background
    const ocean = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    ocean.setAttribute('x', '0'); ocean.setAttribute('y', '0');
    ocean.setAttribute('width', String(MAP_W)); ocean.setAttribute('height', String(MAP_H));
    ocean.setAttribute('fill', '#0b1026');
    ocean.style.cursor = 'pointer';
    ocean.onclick = () => this.deselect();
    this.viewportG.appendChild(ocean);

    this.paths = {};
    this.countries = WORLD_COUNTRIES;
    this.countries.forEach((c) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('data-code', c.code);
      path.setAttribute('d', c.d);
      path.setAttribute('fill-rule', 'evenodd');
      path.style.cursor = 'pointer';
      path.onmouseenter = (e) => this._onHover(c.code, e.clientX, e.clientY);
      path.onmouseleave = () => this._onHover(null);
      path.onclick = (e) => { e.stopPropagation(); this.select(c.code); };
      this.viewportG.appendChild(path);
      this.paths[c.code] = path;
    });

    // flag markers (scale naturally with the viewBox)
    this.markers = {};
    this.countries.forEach((c) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('data-code', c.code);
      g.setAttribute('transform', `translate(${c.cx},${c.cy})`);
      g.style.cursor = 'pointer';
      g.onclick = (e) => { e.stopPropagation(); this.select(c.code); };
      g.onmouseenter = (e) => this._onHover(c.code, e.clientX, e.clientY);
      g.onmouseleave = () => this._onHover(null);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '6');
      circle.setAttribute('fill', 'rgba(11,16,38,0.7)');
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '1.4');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('y', '5');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '15');
      text.setAttribute('pointer-events', 'none');
      text.textContent = c.flag;

      g.appendChild(circle);
      g.appendChild(text);
      this.viewportG.appendChild(g);
      this.markers[c.code] = { g, circle };
    });

    // tooltip (screen space)
    const tip = document.createElement('div');
    tip.id = 'map-tooltip';
    tip.style.cssText =
      'position:absolute;pointer-events:none;z-index:20;'+
      'background:rgba(15,17,23,0.92);color:#c8cad8;padding:7px 11px;'+
      'border-radius:4px;border:1px solid #2a2d3e;font-size:12px;'+
      'white-space:nowrap;display:none;box-shadow:0 4px 12px rgba(0,0,0,0.35);';
    wrap.appendChild(tip);
    this.tooltip = tip;

    wrap.appendChild(svg);
    this.container.appendChild(wrap);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'map-reset';
    reset.textContent = 'RESET VIEW';
    reset.style.cssText =
      'position:absolute;left:8px;bottom:8px;z-index:15;'+
      'background:#161822;border:1px solid #2a2d3e;color:#c8cad8;'+
      'padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;';
    reset.onclick = () => this.resetView();
    wrap.appendChild(reset);
  }

  _bindEvents() {
    const wrap = this.container.firstElementChild;
    const svg = this.svg;

    // zoom on wheel
    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const base = this._screenToRoot(e.clientX, e.clientY);
      const factor = e.deltaY > 0 ? 0.88 : 1 / 0.88;
      const newW = Math.min(MAX_W, Math.max(MIN_W, this.vb.w * factor));
      const newH = newW * ASPECT;
      // keep cursor pinned to the same map point
      this.vb.x = this.vb.x - (base.x - this.vb.x) * (newW - this.vb.w) / this.vb.w;
      this.vb.y = this.vb.y - (base.y - this.vb.y) * (newH - this.vb.h) / this.vb.h;
      this.vb.w = newW;
      this.vb.h = newH;
      this._setViewBox();
    }, { passive: false });

    // pan on drag
    wrap.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this._drag.active = true;
      this._drag.start = this._screenToRoot(e.clientX, e.clientY);
      wrap.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!this._drag.active) return;
      const cur = this._screenToRoot(e.clientX, e.clientY);
      const s = this._drag.start;
      this.vb.x -= (cur.x - s.x);
      this.vb.y -= (cur.y - s.y);
      this._drag.start = cur;
      this._setViewBox();
    });
    window.addEventListener('mouseup', () => {
      this._drag.active = false;
      this.container.querySelector('.map-viewport').style.cursor = 'grab';
    });
  }

  _screenToRoot(clientX, clientY) {
    const pt = this.svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  _setViewBox() {
    const { x, y, w, h } = this.vb;
    this.svg.setAttribute('viewBox', `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
  }

  /* ------------------------------------------------------------------ */
  /* public API                                                         */
  /* ------------------------------------------------------------------ */

  setMe(userId) { this.me = userId; this.render(); }

  setOwnership(ownership) {
    this.ownership = ownership || {};
    this.render();
  }

  select(code) {
    if (!code) { this.deselect(); return; }
    const exists = this.countries.some((c) => c.code === code);
    if (!exists) return;
    this.selectedCode = code;
    this.hoverCode = null;
    this.tooltip.style.display = 'none';
    this.render();
    const c = this.countries.find((x) => x.code === code);
    if (c) this.onSelect(code, c);
  }

  deselect() {
    this.selectedCode = null;
    this.render();
    this.onSelect(null, null);
  }

  getSelected() { return this.selectedCode; }

  _onHover(code, clientX, clientY) {
    this.hoverCode = code;
    this.render();
    if (code) {
      const c = this.countries.find((x) => x.code === code);
      this._showTooltip(clientX, clientY, c);
      this.onHover(code, c);
    } else {
      this.tooltip.style.display = 'none';
      this.onHover(null, null);
    }
  }

  _showTooltip(clientX, clientY, c) {
    const own = this.ownership[c.code];
    const taken = own && own.owner;
    let status = 'Available';
    if (taken) {
      status = own.owner === this.me ? 'Your country' : 'Owned by ' + (own.ownerUsername || 'another player');
    }
    const tip = this.tooltip;
    tip.innerHTML =
      '<div style="font-weight:700;color:#9bcff6">' + c.flag + ' ' + c.name + '</div>' +
      '<div style="font-size:11px;color:#8890a4;margin-top:2px">' + status + '</div>';
    tip.style.display = 'block';
    tip.style.left = (clientX + 14) + 'px';
    tip.style.top = (clientY + 14) + 'px';
  }

  resetView() {
    this.vb = { x: 0, y: 0, w: MAP_W, h: MAP_H };
    this._setViewBox();
  }

  render() {
    const me = this.me;
    this.countries.forEach((c) => {
      const path = this.paths[c.code];
      const marker = this.markers[c.code];
      const own = this.ownership[c.code];
      const taken = own && own.owner;
      const mine = taken && own.owner === me;
      const selected = this.selectedCode === c.code;
      const hovered = this.hoverCode === c.code;

      let fill;
      if (!taken) fill = hovered ? '#5abf7a' : '#3f8f5a';
      else if (mine) fill = selected ? '#3d6bd6' : (hovered ? '#5a8bd6' : '#4a9ad6');
      else fill = hovered ? '#8a98b3' : '#6b7d9e';

      path.setAttribute('fill', fill);
      if (selected) {
        path.setAttribute('stroke', '#ffd54a');
        path.setAttribute('stroke-width', '2.2');
      } else if (mine) {
        path.setAttribute('stroke', '#3d6bd6');
        path.setAttribute('stroke-width', '1.4');
      } else {
        path.setAttribute('stroke', taken ? '#4a5a75' : '#2d4a3a');
        path.setAttribute('stroke-width', '0.5');
      }

      if (marker) {
        const circle = marker.circle;
        if (mine) { circle.setAttribute('stroke', '#3ecf8e'); circle.setAttribute('stroke-width', '2.2'); }
        else if (taken) { circle.setAttribute('stroke', '#e55454'); circle.setAttribute('stroke-width', '1.8'); }
        else { circle.setAttribute('stroke', '#ffffff'); circle.setAttribute('stroke-width', '1.4'); }
      }
    });
  }
}
