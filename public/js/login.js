// Star field
var starsContainer = document.getElementById('stars');
var STAR_COUNT = 55;
for (var i = 0; i < STAR_COUNT; i++) {
  var s = document.createElement('span');
  s.className = 'star';
  s.style.left = (Math.random() * 100) + '%';
  s.style.top = (Math.random() * 100) + '%';
  var size = (Math.random() * 1.6 + 0.6).toFixed(2);
  s.style.width = size + 'px';
  s.style.height = size + 'px';
  s.style.animationDuration = (Math.random() * 4 + 3).toFixed(2) + 's';
  s.style.animationDelay = (Math.random() * 5).toFixed(2) + 's';
  starsContainer.appendChild(s);
}

// Parallax orbs (respects reduced motion)
var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced) {
  var layers = [document.getElementById('orb-layer-1'), document.getElementById('orb-layer-2'), document.getElementById('orb-layer-3')];
  window.addEventListener('mousemove', function (e) {
    var x = (e.clientX / window.innerWidth - 0.5);
    var y = (e.clientY / window.innerHeight - 0.5);
    layers.forEach(function (layer, idx) {
      var depth = (idx + 1) * 12;
      layer.style.transform = 'translate(' + (x * depth) + 'px, ' + (y * depth) + 'px)';
    });
  });
}

// Password visibility toggle
document.querySelectorAll('.toggle-password').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var input = btn.parentElement.querySelector('input');
    var showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    btn.classList.toggle('is-active', !showing);
    btn.setAttribute('aria-label', showing ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
  });
});

// Prevent placeholder anchors from jumping to top
document.querySelectorAll('a[href="#"]').forEach(function (a) {
  a.addEventListener('click', function (e) { e.preventDefault(); });
});

