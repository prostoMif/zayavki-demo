'use strict';
(function () {
  var C, state = { machine: null, hours: 4, zone: null };
  var $ = function (s) { return document.querySelector(s); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function rub(n) { return Math.round(n / 100) * 100; }
  function fmt(n) { return rub(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽'; }

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
    $('#have-sub').textContent = C.have_sub || '';
    var tiles = $('#fleet-list');
    C.machines.forEach(function (m) {
      var t = el('div', 'tile'); t.appendChild(el('b', null, m.name)); t.appendChild(el('span', null, m.desc)); tiles.appendChild(t);
    });
    if (C.services && C.services.length) {
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

  fetch('company.json').then(function (r) { return r.json(); }).then(function (j) { C = j; build(); })
    .catch(function () { document.body.insertBefore(el('p', 'fail', 'Не удалось загрузить данные страницы.'), document.body.firstChild); });
})();
