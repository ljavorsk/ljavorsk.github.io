/* ============================================================
   javorsky.me — dynamic effects
   terminal typing · particle network · scrollspy · counters
   All effects respect prefers-reduced-motion and degrade
   gracefully when JS is unavailable (content is in the HTML).
   ============================================================ */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* ---------------- terminal typing ---------------- */
  var termBody = document.getElementById("term-body");

  var SEQUENCE = [
    { cmd: "whoami", out: ["lukas.javorsky — product security & open source"] },
    { cmd: "cat role.txt", out: ["Senior Product Security Engineer @ Red Hat", "Incident Commander · EU-CRA · ETSI delegate"] },
    {
      cmd: "./expertise --list",
      out: [
        "[+] product & software security",
        "[+] incident response",
        "[+] vulnerability management",
        "[+] EU Cyber Resilience Act",
        "[+] Linux & open-source security"
      ]
    },
    { cmd: "uptime", out: ["7+ years in open source — and counting"] },
    { cmd: "cat contact.txt", out: ["linkedin.com/in/lukas-javorsky · github.com/ljavorsk"] }
  ];

  function tLine() {
    var line = document.createElement("div");
    line.className = "t-line";
    var prompt = document.createElement("span");
    prompt.className = "t-prompt";
    prompt.textContent = "[ljavorsk@javorsky-me ~]$ ";
    var cmd = document.createElement("span");
    cmd.className = "t-cmd";
    line.appendChild(prompt);
    line.appendChild(cmd);
    var cursor = document.createElement("span");
    cursor.className = "t-cursor";
    cursor.textContent = "█";
    line.appendChild(cursor);
    termBody.appendChild(line);
    return { cmd: cmd, cursor: cursor };
  }

  function tOut(text, ok) {
    var line = document.createElement("div");
    line.className = "t-out" + (ok ? " ok" : "");
    line.textContent = text;
    termBody.appendChild(line);
  }

  async function runTerminal() {
    if (!termBody) return;
    if (prefersReduced) return; // keep static pre-rendered content

    while (true) {
      termBody.innerHTML = "";
      for (var i = 0; i < SEQUENCE.length; i++) {
        var entry = SEQUENCE[i];
        var parts = tLine();
        for (var c = 0; c < entry.cmd.length; c++) {
          parts.cmd.textContent += entry.cmd.charAt(c);
          await sleep(28 + Math.random() * 46);
        }
        await sleep(260);
        parts.cursor.remove();
        for (var o = 0; o < entry.out.length; o++) {
          tOut(entry.out[o], entry.out[o].indexOf("[+]") === 0);
          await sleep(140);
        }
        await sleep(520);
      }
      var idle = tLine();
      await sleep(7000);
      idle.cursor.remove();
    }
  }

  /* ---------------- particle network background ---------------- */
  var canvas = document.getElementById("bg");

  function initCanvas() {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var mouse = { x: -9999, y: -9999 };
    var running = !prefersReduced;

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      spawn();
    }

    function spawn() {
      particles = [];
      var count = Math.min(85, Math.floor((window.innerWidth * window.innerHeight) / 22000));
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.22 * dpr,
          vy: (Math.random() - 0.5) * 0.22 * dpr,
          r: (Math.random() * 1.4 + 0.6) * dpr
        });
      }
    }

    function step() {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var linkDist = 150 * dpr;
      var mx = mouse.x * dpr, my = mouse.y * dpr;

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // gentle repel from cursor
        var dx = p.x - mx, dy = p.y - my;
        var md = Math.sqrt(dx * dx + dy * dy);
        if (md < 120 * dpr && md > 0.01) {
          p.x += (dx / md) * 0.6;
          p.y += (dy / md) * 0.6;
        }

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(90, 170, 230, 0.5)";
        ctx.fill();

        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var ddx = p.x - q.x, ddy = p.y - q.y;
          var d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < linkDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(70, 150, 210, " + (0.14 * (1 - d / linkDist)) + ")";
            ctx.lineWidth = dpr * 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(step);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        running = false;
      } else if (!prefersReduced) {
        running = true;
        requestAnimationFrame(step);
      }
    });

    resize();
    if (prefersReduced) {
      // draw one static frame
      running = true;
      step();
      running = false;
    } else {
      requestAnimationFrame(step);
    }
  }

  /* ---------------- scroll reveal ---------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || prefersReduced) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- scrollspy ---------------- */
  function initScrollspy() {
    var links = document.querySelectorAll("#nav-links a");
    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) sections.push({ link: link, sec: sec });
    });

    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            links.forEach(function (l) { l.classList.remove("active"); });
            var match = sections.find(function (s) { return s.sec === entry.target; });
            if (match) match.link.classList.add("active");
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach(function (s) { io.observe(s.sec); });
  }

  /* ---------------- scroll progress bar ---------------- */
  function initProgress() {
    var bar = document.getElementById("scroll-bar");
    if (!bar) return;
    var update = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------------- animated counters ---------------- */
  function initCounters() {
    var nums = document.querySelectorAll(".stat-num");
    if (prefersReduced) return;

    function animate(el) {
      var target = parseInt(el.getAttribute("data-target"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var duration = 1300;
      var start = null;
      function frame(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + (progress === 1 ? suffix : "");
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- misc ---------------- */
  function initMisc() {
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ---------------- boot ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initMisc();
    initReveal();
    initScrollspy();
    initProgress();
    initCounters();
    initCanvas();
    runTerminal();
  });
})();
