'use strict';
(function () {
  var C, state = { machine: null, hours: 4, zone: null };
  var $ = function (s) { return document.querySelector(s); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function rub(n) { return Math.round(n / 100) * 100; }
  function fmt(n) { return rub(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽'; }


  var ICONS = {
    excavator: '<rect x="6" y="28" width="30" height="8" rx="4"/><rect x="12" y="18" width="14" height="10"/><polyline points="24,20 38,8 50,18"/><path d="M50 18l6 8h-10z"/>',
    dump: '<rect x="4" y="12" width="32" height="16"/><rect x="38" y="18" width="16" height="10"/><circle cx="14" cy="32" r="4"/><circle cx="46" cy="32" r="4"/>',
    loader: '<rect x="22" y="16" width="20" height="12"/><path d="M6 14h14l-2 14H6z"/><circle cx="26" cy="32" r="4"/><circle cx="42" cy="32" r="4"/>',
    crane: '<rect x="4" y="26" width="30" height="8"/><polyline points="10,26 46,6"/><line x1="46" y1="6" x2="46" y2="22"/><circle cx="12" cy="36" r="3"/><circle cx="28" cy="36" r="3"/>',
    manip: '<rect x="4" y="20" width="30" height="10"/><rect x="36" y="22" width="12" height="8"/><polyline points="30,20 30,8 46,8"/><circle cx="12" cy="34" r="3"/><circle cx="42" cy="34" r="3"/>',
    trawl: '<rect x="4" y="22" width="52" height="5"/><rect x="40" y="12" width="14" height="10"/><circle cx="12" cy="32" r="3"/><circle cx="22" cy="32" r="3"/><circle cx="46" cy="32" r="3"/>',
    lift: '<rect x="4" y="26" width="28" height="8"/><polyline points="12,26 34,8"/><rect x="34" y="4" width="10" height="8"/><circle cx="12" cy="37" r="3"/><circle cx="26" cy="37" r="3"/>',
    dozer: '<rect x="14" y="28" width="30" height="8" rx="4"/><rect x="20" y="16" width="16" height="12"/><path d="M4 12v22h8"/>',
    tractor: '<rect x="22" y="14" width="18" height="12"/><circle cx="14" cy="28" r="7"/><circle cx="44" cy="31" r="5"/>',
    drill: '<rect x="4" y="22" width="30" height="8"/><line x1="42" y1="4" x2="42" y2="36"/><polyline points="38,32 42,38 46,32"/>',
    carrier: '<rect x="4" y="24" width="50" height="4"/><rect x="40" y="12" width="14" height="12"/><rect x="8" y="14" width="10" height="10"/><rect x="22" y="14" width="10" height="10"/><circle cx="12" cy="32" r="3"/><circle cx="46" cy="32" r="3"/>'
  };
  function icon(id) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 60 40'); s.setAttribute('class', 'ico'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICONS[String(id).replace(/\d+$/, '')] || ICONS[id] || ICONS.dump;
    return s;
  }

  function price() {
    if (!state.machine || !state.zone) return null;
    var base = state.machine.rate * state.hours;
    return { from: rub(base + state.zone.from), to: rub(base * (1 + C.spread) + state.zone.to) };
  }

  function message() {
    var p = price(), m = state.machine;
    var date = $('#date').value, addr = $('#addr').value.trim(), name = $('#name').value.trim(), tel = $('#tel').value.trim();
    var l = ['Здравствуйте! Заявка со страницы.', 'Техника: ' + m.name, 'Время: ' + state.hours + ' ч'];
    if (date) l.push('Дата: ' + date.split('-').reverse().join('.'));
    if (addr) l.push('Адрес: ' + addr);
    l.push('Район: ' + state.zone.name);
    l.push('Примерно: от ' + fmt(p.from) + ' до ' + fmt(p.to));
    if (name) l.push('Имя: ' + name);
    if (tel) l.push('Телефон: ' + tel);
    return l.join('\n');
  }

  function render() {
    var p = price(), box = $('#result');
    var ready = !!state.machine;
    $('#send').hidden = !ready;
    $('#need').hidden = ready;
    if (!ready) return;
    $('#price-from').textContent = fmt(p.from);
    $('#price-to').textContent = fmt(p.to);
    $('#hours-val').textContent = state.hours + ' ч';
    $('#sum-machine').textContent = state.machine.name;
    var valid = $('#tel').value.replace(/\D/g, '').length >= 10;
    if ($('#btn-wa')) $('#btn-wa').setAttribute('aria-disabled', valid ? 'false' : 'true');
    if ($('#btn-tg')) $('#btn-tg').setAttribute('aria-disabled', valid ? 'false' : 'true');
    $('#tel-hint').hidden = valid;
  }

  function renderAbout() {
    if (C.photo) {
      var img = $('#hero-img'); img.src = C.photo; img.alt = C.name;
      img.addEventListener('error', function () { $('#hero-photo').hidden = true; });
      $('#hero-photo').hidden = false;
    }
    if (C.rating) {
      var r = $('#rating');
      r.textContent = '★ ' + String(C.rating).replace('.', ',') + (C.reviews ? ' · ' + C.reviews + ' ' + plural(C.reviews, ['отзыв', 'отзыва', 'отзывов']) + ' на 2ГИС' : '');
      r.hidden = false;
    }
    var T = C.texts || {};
    document.querySelectorAll('[data-t]').forEach(function (n) { if (T[n.dataset.t] != null && T[n.dataset.t] !== '') n.textContent = T[n.dataset.t]; });
    var S = C.sections || {};
    if (S.how === false) $('#how').remove();
    if (C.gallery && C.gallery.length && S.gallery !== false) {
      var g = $('#gallery-list');
      C.gallery.forEach(function (src) { var im = el('img'); im.src = src; im.alt = ''; im.loading = 'lazy'; im.addEventListener('error', function () { im.remove(); }); g.appendChild(im); });
      $('#gallery').hidden = false;
    }
    var tiles = $('#fleet-list');
    C.machines.forEach(function (m) {
      var t = el('div', 'tile'); t.appendChild(icon(m.id)); t.appendChild(el('b', null, m.name)); t.appendChild(el('span', null, m.desc)); tiles.appendChild(t);
    });
    if (C.services && C.services.length && S.services !== false) {
      var ul = $('#services-list');
      C.services.forEach(function (x) { ul.appendChild(el('li', null, x)); });
      $('#services').hidden = false;
    }
    var ph = $('#phones');
    C.phones.forEach(function (p) { var a = el('a', null, p.display); a.href = 'tel:' + p.value; ph.appendChild(a); });
    if (!C.telegram) { $('#hero-tg').remove(); $('#btn-tg').remove(); }
    if (!C.whatsapp) { document.querySelectorAll('[data-wa]').forEach(function (n) { n.remove(); }); }
  }
  function plural(n, f) { var a = n % 10, b = n % 100; return a === 1 && b !== 11 ? f[0] : (a >= 2 && a <= 4 && (b < 10 || b >= 20)) ? f[1] : f[2]; }

  function build() {
    document.title = C.name + ' — ' + C.headline;
    document.querySelectorAll('[data-c]').forEach(function (n) { n.textContent = C[n.dataset.c]; });
    document.querySelectorAll('[data-tel]').forEach(function (a) { a.href = 'tel:' + C.phone; if (a.dataset.tel === 'text') a.textContent = C.phone_display; });
    document.querySelectorAll('[data-wa]').forEach(function (a) { a.href = 'https://wa.me/' + C.whatsapp; });
    document.querySelectorAll('[data-tg]').forEach(function (a) { a.href = 'https://t.me/' + C.telegram; });
    document.querySelectorAll('[data-map]').forEach(function (a) { a.href = C.map; });
    renderAbout();
    if (!C.demo) document.querySelectorAll('.demo').forEach(function (n) { n.remove(); });
    if (!C.rates_are_example) document.querySelectorAll('.example').forEach(function (n) { n.remove(); });

    var list = $('#machines');
    C.machines.forEach(function (m, i) {
      var id = 'm-' + m.id;
      var lab = el('label', 'machine');
      var inp = el('input'); inp.type = 'radio'; inp.name = 'machine'; inp.value = m.id; inp.id = id;
      if (m.busy) inp.disabled = true;
      inp.addEventListener('change', function () {
        state.machine = m;
        if (state.hours < m.min_hours) state.hours = m.min_hours;
        render();
      });
      var body = el('span', 'machine-body');
      body.appendChild(icon(m.id));
      body.appendChild(el('span', 'machine-name', m.name));
      body.appendChild(el('span', 'machine-desc', m.desc));
      body.appendChild(el('span', 'machine-rate', m.busy ? 'сейчас занята' : 'от ' + fmt(m.rate) + ' / час'));
      lab.appendChild(inp); lab.appendChild(body); list.appendChild(lab);
    });

    var zone = $('#zone');
    C.zones.forEach(function (z, i) {
      var o = el('option', null, z.name); o.value = z.id; zone.appendChild(o);
    });
    state.zone = C.zones[0];
    zone.addEventListener('change', function () { state.zone = C.zones.filter(function (z) { return z.id === zone.value; })[0]; render(); });

    $('#minus').addEventListener('click', function () { var min = state.machine ? state.machine.min_hours : 1; if (state.hours > min) { state.hours--; render(); } });
    $('#plus').addEventListener('click', function () { if (state.hours < 24) { state.hours++; render(); } });
    ['date', 'addr', 'name', 'tel'].forEach(function (id) { $('#' + id).addEventListener('input', render); });

    var d = new Date(); d.setDate(d.getDate() + 1);
    $('#date').min = new Date().toISOString().slice(0, 10);

    if ($('#btn-wa')) $('#btn-wa').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.getAttribute('aria-disabled') === 'true') { $('#tel').focus(); return; }
      window.open('https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
    });
    if ($('#btn-tg')) $('#btn-tg').addEventListener('click', function (e) {
      e.preventDefault();
      if (this.getAttribute('aria-disabled') === 'true') { $('#tel').focus(); return; }
      var msg = message(), note = $('#tg-note');
      var done = function () { note.hidden = false; window.open('https://t.me/' + C.telegram, '_blank', 'noopener'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(done, done); else done();
    });
    render();
  }

  function override(j) {
    if (!j.demo) return j;
    var key = 'demo-override:' + j.name + '|' + j.phone, o;
    try { o = JSON.parse(localStorage.getItem(key)); } catch (e) { o = null; }
    if (!o) return j;
    if (o.machines) j.machines = o.machines.filter(function (m) { return !m.hidden; });
    if (o.services) j.services = o.services;
    if (o.photo) j.photo = o.photo;
    if (o.about) j.about = o.about;
    if (o.texts) j.texts = o.texts;
    if (o.sections) j.sections = o.sections;
    if (o.gallery) j.gallery = o.gallery;
    j.zones.forEach(function (z) { var v = (o.zones || {})[z.id]; if (v) { z.from = v.from; z.to = v.to; } });
    ['spread', 'phone', 'phone_display', 'whatsapp', 'hours', 'address', 'rates_are_example'].forEach(function (k) { if (o[k] != null) j[k] = o[k]; });
    j._ovr = key;
    return j;
  }
  fetch('company.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { C = override(j); C.machines = C.machines.filter(function (m) { return !m.hidden; }); build();
      if (C._ovr) { var b = $('#ovr'); b.hidden = false; $('#ovr-reset').addEventListener('click', function (e) { e.preventDefault(); try { localStorage.removeItem(C._ovr); } catch (x) {} location.reload(); }); } })
    .catch(function () { document.body.insertBefore(el('p', 'fail', 'Не удалось загрузить данные страницы.'), document.body.firstChild); });
})();
