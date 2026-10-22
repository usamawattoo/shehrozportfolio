/* Shahroz Ali - Data Entry Portfolio: site behaviour (no libraries needed) */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var WA_NUMBER = CFG.whatsappNumber || "923345800917";
  var OWNER = CFG.ownerName || "Shahroz";

  /* ---------- WhatsApp message builder (same wording as the static links) ---------- */
  function buildMessage(service, pkg, price) {
    var lines = ["Hello Shahroz, I would like to place an order from your website.", "", "Service: " + service];
    if (pkg) lines.push("Package: " + pkg);
    if (price) lines.push("Price: " + price);
    lines.push("", "Please confirm the details and next steps. Thank you.");
    return lines.join("\n");
  }
  function waLink(message) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
  }
  function refreshButton(btn) {
    btn.setAttribute(
      "href",
      waLink(buildMessage(btn.dataset.waService, btn.dataset.waPackage, btn.dataset.waPrice))
    );
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- Footer year ---------- */
  var year = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) { el.textContent = year; });

  /* ---------- Service rows: choose a package, price + WhatsApp link update ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".svc-row"), function (row) {
    var select = row.querySelector(".pkg-select");
    var btn = row.querySelector("[data-wa-btn]");
    var out = row.querySelector("[data-price-out]");
    if (!select || !btn) return;
    select.addEventListener("change", function () {
      var opt = select.options[select.selectedIndex];
      btn.dataset.waPackage = opt.value;
      btn.dataset.waPrice = opt.dataset.price;
      if (out) out.textContent = opt.dataset.price;
      refreshButton(btn);
    });
  });

  /* ---------- Pricing page: choose which service the packages are for ---------- */
  var serviceChoice = document.getElementById("serviceChoice");
  if (serviceChoice) {
    serviceChoice.addEventListener("change", function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-pkg-btn]"), function (btn) {
        btn.dataset.waService = serviceChoice.value;
        refreshButton(btn);
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    var status = document.getElementById("formStatus");
    var sendBtn = document.getElementById("sendBtn");
    var waBtn = document.getElementById("waFormBtn");

    var show = function (text, isError) {
      status.textContent = text;
      status.className = "form-status show" + (isError ? " error" : "");
    };
    var values = function () {
      var f = new FormData(form);
      return {
        name: (f.get("name") || "").toString().trim(),
        email: (f.get("email") || "").toString().trim(),
        phone: (f.get("phone") || "").toString().trim(),
        service: (f.get("service") || "").toString().trim(),
        message: (f.get("message") || "").toString().trim()
      };
    };

    // Option 1: send through FormSubmit (needs the one-time email activation)
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var v = values();
      if (form.elements["_honey"] && form.elements["_honey"].value) return; // spam trap

      sendBtn.disabled = true;
      var oldLabel = sendBtn.textContent;
      sendBtn.textContent = "Sending...";
      show("Sending your message...", false);

      var payload = {
        name: v.name, email: v.email, phone: v.phone, service: v.service, message: v.message,
        _subject: "New website enquiry from " + v.name,
        _template: "table",
        _captcha: "false"
      };

      fetch("https://formsubmit.co/ajax/" + encodeURIComponent(CFG.formEmail || CFG.email), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          var ok = data && (data.success === true || data.success === "true");
          if (ok) {
            form.reset();
            show("Thank you, " + v.name + ". Your message was sent. For a faster reply you can also message me on WhatsApp.", false);
          } else {
            var why = data && data.message ? " (" + data.message + ")" : "";
            show("Your message could not be delivered by the form" + why + ". Please use the WhatsApp button below or email " + (CFG.email || "me") + " directly.", true);
          }
        })
        .catch(function () {
          show("The form could not reach the server. Please use the WhatsApp button below or email " + (CFG.email || "me") + " directly.", true);
        })
        .then(function () {
          sendBtn.disabled = false;
          sendBtn.textContent = oldLabel;
        });
    });

    // Option 2: send the same details through WhatsApp (works immediately)
    if (waBtn) {
      waBtn.addEventListener("click", function () {
        var v = values();
        if (!v.name || !v.message) {
          show("Please fill in your name and message first, then tap the WhatsApp button.", true);
          form.elements["name"].focus();
          return;
        }
        var lines = ["Hello Shahroz, I found you through your website.", "", "Name: " + v.name];
        if (v.service) lines.push("Service: " + v.service);
        if (v.email) lines.push("Email: " + v.email);
        lines.push("", v.message);
        window.open(waLink(lines.join("\n")), "_blank", "noopener");
      });
    }
  }
})();
