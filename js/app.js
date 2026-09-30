/* =====================================================
   ROYAL STAY HOTEL BOOKING SYSTEM (Vanilla JS only)
===================================================== */

/* ---------- UI ENHANCEMENTS (animations / nav) ---------- */
function initUI() {
  // Sticky navbar shadow
  var navbar = document.getElementById("navbar");
  function onScroll() {
    if (!navbar) return;
    if (window.scrollY > 10) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile hamburger
  var burger = document.getElementById("hamburger");
  var menu = document.getElementById("navMenu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      menu.classList.toggle("open");
      burger.textContent = menu.classList.contains("open") ? "✕" : "☰";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        burger.textContent = "☰";
      });
    });
  }

  // Auto active link (if class not set)
  try {
    var page = (location.pathname.split("/").pop() || "index.html").split("?")[0];
    if (menu) {
      menu.querySelectorAll("a").forEach(function (a) {
        var href = a.getAttribute("href");
        if (href === page) a.classList.add("active");
      });
    }
  } catch (e) {}

  // Scroll reveal
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  // Animated counters
  var counters = document.querySelectorAll(".counter");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        cio.unobserve(el);
        var target = parseInt(el.getAttribute("data-target") || "0", 10);
        var start = null, dur = 1400;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  // Pre-select room from URL ?room=
  try {
    var params = new URLSearchParams(location.search);
    var qRoom = params.get("room");
    var roomSel = document.getElementById("room");
    if (qRoom && roomSel) {
      for (var i = 0; i < roomSel.options.length; i++) {
        if (roomSel.options[i].value.toLowerCase() === qRoom.toLowerCase()) {
          roomSel.selectedIndex = i;
          roomSel.dispatchEvent(new Event("change"));
          break;
        }
      }
    }
  } catch (e) {}
}

/* =====================================================
   DARK MODE
===================================================== */
function initTheme() {
  var savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") document.body.classList.add("dark-theme");
  if (!document.getElementById("themeToggle")) {
    var button = document.createElement("button");
    button.id = "themeToggle";
    button.className = "theme-toggle";
    updateThemeButton(button);
    button.addEventListener("click", function () {
      document.body.classList.toggle("dark-theme");
      localStorage.setItem(document.body.classList.contains("dark-theme") ? "dark" : "light", document.body.classList.contains("dark-theme") ? "dark" : "light");
      localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
      updateThemeButton(button);
    });
    var nav = document.querySelector(".navbar nav");
    if (nav) nav.appendChild(button);
    else document.body.appendChild(button);
  }
}
function updateThemeButton(button) {
  button.innerHTML = document.body.classList.contains("dark-theme") ? "☀️ Light" : "🌙 Dark";
}

/* =====================================================
   MAIN
===================================================== */
document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initUI();
  initBooking();
  initPayment();
  initDashboard();
  initInvoice();
});

/* =====================================================
   BOOKING
===================================================== */
function initBooking() {
  var form = document.getElementById("bookingForm");
  if (!form) return;
  var room = document.getElementById("room");
  var checkin = document.getElementById("checkin");
  var checkout = document.getElementById("checkout");
  var priceDisplay = document.getElementById("pricePerNight");
  var nightsDisplay = document.getElementById("totalNights");
  var totalDisplay = document.getElementById("totalAmount");
  var availability = document.getElementById("roomAvailability");
  var prices = { "Deluxe Room": 5000, "Executive Suite": 8000, "Presidential Suite": 15000 };
  var today = new Date().toISOString().split("T")[0];
  checkin.min = today;
  checkout.min = today;

  function calculateTotal() {
    var selectedRoom = room.value;
    var price = prices[selectedRoom] || 0;
    priceDisplay.innerText = "৳" + price.toLocaleString();
    if (!checkin.value || !checkout.value) {
      nightsDisplay.innerText = "0";
      totalDisplay.innerText = "৳0";
      return;
    }
    var start = new Date(checkin.value);
    var end = new Date(checkout.value);
    var nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (nights <= 0) {
      nightsDisplay.innerText = "0";
      totalDisplay.innerText = "৳0";
      return;
    }
    nightsDisplay.innerText = nights;
    totalDisplay.innerText = "৳" + (nights * price).toLocaleString();
    // subtle pop animation
    totalDisplay.style.transform = "scale(1.12)";
    setTimeout(function () { totalDisplay.style.transition = "transform .25s"; totalDisplay.style.transform = "scale(1)"; }, 120);
  }

  window.checkRoomAvailability = function () {
    var selectedRoom = room.value;
    if (!selectedRoom || !checkin.value || !checkout.value) return true;
    var newStart = new Date(checkin.value);
    var newEnd = new Date(checkout.value);
    if (newEnd <= newStart) {
      availability.innerHTML = "⚠️ Please select valid dates.";
      availability.className = "availability-message unavailable";
      return false;
    }
    var bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    var conflict = bookings.some(function (booking) {
      if (booking.status === "Cancelled") return false;
      if (booking.room !== selectedRoom) return false;
      var bookedStart = new Date(booking.checkin);
      var bookedEnd = new Date(booking.checkout);
      return (newStart < bookedEnd && newEnd > bookedStart);
    });
    if (conflict) {
      availability.innerHTML = "❌ This room is already booked for these dates.";
      availability.className = "availability-message unavailable";
      return false;
    } else {
      availability.innerHTML = "✅ Room is available for these dates.";
      availability.className = "availability-message available";
      return true;
    }
  };

  room.addEventListener("change", function () { calculateTotal(); window.checkRoomAvailability(); });
  checkin.addEventListener("change", function () { checkout.min = checkin.value; calculateTotal(); window.checkRoomAvailability(); });
  checkout.addEventListener("change", function () { calculateTotal(); window.checkRoomAvailability(); });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!window.checkRoomAvailability()) { alert("❌ This room is not available."); return; }
    var selectedRoom = room.value;
    var price = prices[selectedRoom] || 0;
    var start = new Date(checkin.value);
    var end = new Date(checkout.value);
    var nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (nights <= 0) { alert("❌ Please select valid dates."); return; }
    var total = nights * price;
    var paymentMethod = document.getElementById("paymentMethod").value;
    var transactionId = document.getElementById("transactionId").value.trim();
    var cardNumber = document.getElementById("cardNumber").value.trim();
    var cardName = document.getElementById("cardName").value.trim();
    var cardExpiry = document.getElementById("cardExpiry").value.trim();
    var cardCVV = document.getElementById("cardCVV").value.trim();
    if (!paymentMethod) { alert("❌ Please select a payment method."); return; }
    if ((paymentMethod === "bKash" || paymentMethod === "Nagad") && !transactionId) { alert("❌ Please enter Transaction ID."); return; }
    if (paymentMethod === "Card" && (!cardNumber || !cardName || !cardExpiry || !cardCVV)) { alert("❌ Please complete card information."); return; }
    var paymentStatus = "Pending";
    var finalTransactionId = transactionId;
    if (paymentMethod === "Cash") { paymentStatus = "Pending"; finalTransactionId = "Pay at Hotel"; }
    else paymentStatus = "Paid";
    var booking = {
      id: "RS" + Date.now(),
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      room: selectedRoom, checkin: checkin.value, checkout: checkout.value,
      guests: document.getElementById("guests").value,
      nights: nights, price: price, total: total, status: "Confirmed",
      paymentMethod: paymentMethod, transactionId: finalTransactionId, paymentStatus: paymentStatus
    };
    var bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    bookings.push(booking);
    localStorage.setItem("bookings", JSON.stringify(bookings));
    localStorage.setItem("lastBooking", JSON.stringify(booking));
    alert("✅ Booking and payment information saved successfully!");
    window.location.href = "invoice.html";
  });
}

/* =====================================================
   PAYMENT UI
===================================================== */
function initPayment() {
  var paymentMethod = document.getElementById("paymentMethod");
  if (!paymentMethod) return;
  var mobileBox = document.getElementById("mobilePaymentBox");
  var cardBox = document.getElementById("cardPaymentBox");
  var status = document.getElementById("paymentStatus");
  paymentMethod.addEventListener("change", function () {
    var method = paymentMethod.value;
    mobileBox.style.display = "none";
    cardBox.style.display = "none";
    status.innerHTML = "";
    if (method === "bKash" || method === "Nagad") {
      mobileBox.style.display = "block";
      status.innerHTML = "💳 Payment will be marked as Paid after entering Transaction ID.";
    }
    if (method === "Card") {
      cardBox.style.display = "block";
      status.innerHTML = "💳 Demo card payment.";
    }
    if (method === "Cash") status.innerHTML = "🏨 Payment will be made at the hotel.";
  });
}

/* =====================================================
   DASHBOARD
===================================================== */
function initDashboard() {
  var table = document.getElementById("bookingTableBody");
  if (!table) return;
  if (localStorage.getItem("adminLoggedIn") !== "true") { window.location.href = "login.html"; return; }
  loadDashboard();
}
function loadDashboard() {
  var bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  var tableBody = document.getElementById("bookingTableBody");
  var noBookings = document.getElementById("noBookings");
  var totalBookings = document.getElementById("totalBookings");
  var totalRevenue = document.getElementById("totalRevenue");
  var confirmedBookings = document.getElementById("confirmedBookings");
  var revenue = 0, confirmed = 0;
  bookings.forEach(function (booking) {
    if (booking.status !== "Cancelled") { confirmed++; revenue += Number(booking.total) || 0; }
  });
  // animate numbers
  animateNumber(totalBookings, bookings.length, "");
  animateNumber(totalRevenue, revenue, "৳");
  animateNumber(confirmedBookings, confirmed, "");
  tableBody.innerHTML = "";
  if (bookings.length === 0) { noBookings.style.display = "block"; return; }
  noBookings.style.display = "none";
  bookings.forEach(function (booking) {
    var row = document.createElement("tr");
    row.innerHTML =
      "<td>" + booking.id + "</td>" +
      "<td>" + booking.name + "</td>" +
      "<td>" + (booking.phone || "N/A") + "</td>" +
      "<td>" + booking.room + "</td>" +
      "<td>" + booking.checkin + "</td>" +
      "<td>" + booking.checkout + "</td>" +
      "<td>" + (booking.guests || "N/A") + "</td>" +
      "<td>" + (booking.nights || "N/A") + "</td>" +
      "<td>৳" + Number(booking.total || 0).toLocaleString() + "</td>" +
      '<td><span class="status ' + (booking.status === "Cancelled" ? "cancelled" : "confirmed") + '">' + booking.status + "</span></td>" +
      "<td>" +
        (booking.status !== "Cancelled"
          ? '<button class="cancel-btn" onclick="cancelBooking(\'' + booking.id + "')\">Cancel</button>"
          : "") +
        '<button class="delete-btn" onclick="deleteBooking(\'' + booking.id + "')\">Delete</button>" +
      "</td>";
    tableBody.appendChild(row);
  });
}
function animateNumber(el, target, prefix) {
  if (!el) return;
  var start = 0, dur = 800, t0 = null;
  function step(ts) {
    if (!t0) t0 = ts;
    var p = Math.min((ts - t0) / dur, 1);
    var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
    el.innerText = (prefix || "") + v.toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function deleteBooking(id) {
  if (!confirm("Are you sure you want to delete this booking?")) return;
  var bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  bookings = bookings.filter(function (booking) { return booking.id !== id; });
  localStorage.setItem("bookings", JSON.stringify(bookings));
  loadDashboard();
}
function cancelBooking(id) {
  var bookings = JSON.parse(localStorage.getItem("bookings")) || [];
  bookings = bookings.map(function (booking) {
    if (booking.id === id) booking.status = "Cancelled";
    return booking;
  });
  localStorage.setItem("bookings", JSON.stringify(bookings));
  loadDashboard();
}

/* =====================================================
   SEARCH
===================================================== */
document.addEventListener("input", function (event) {
  if (event.target.id !== "bookingSearch") return;
  var keyword = event.target.value.toLowerCase().trim();
  document.querySelectorAll("#bookingTableBody tr").forEach(function (row) {
    row.style.display = row.innerText.toLowerCase().includes(keyword) ? "" : "none";
  });
});

/* =====================================================
   LOGIN / LOGOUT
===================================================== */
document.addEventListener("DOMContentLoaded", function () {
  var loginForm = document.getElementById("loginForm");
  if (!loginForm) return;
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;
    var error = document.getElementById("loginError");
    if (username === "admin" && password === "12345") {
      localStorage.setItem("adminLoggedIn", "true");
      window.location.href = "dashboard.html";
    } else {
      error.innerText = "❌ Invalid username or password.";
      loginForm.style.animation = "none";
      void loginForm.offsetWidth;
      loginForm.style.animation = "heroUp .4s ease";
    }
  });
});
function logoutAdmin() {
  localStorage.removeItem("adminLoggedIn");
  window.location.href = "login.html";
}

/* =====================================================
   INVOICE
===================================================== */
function initInvoice() {
  if (!document.getElementById("invoiceId")) return;
  loadInvoice();
}
function loadInvoice() {
  var booking = JSON.parse(localStorage.getItem("lastBooking"));
  if (!booking) return;
  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.innerText = value;
  }
  setText("invoiceId", booking.id);
  setText("guestName", booking.name);
  setText("guestEmail", booking.email);
  setText("guestPhone", booking.phone);
  setText("guestCount", booking.guests);
  setText("guestRoom", booking.room);
  setText("guestCheckin", booking.checkin);
  setText("guestCheckout", booking.checkout);
  setText("invoiceRoom", booking.room);
  setText("invoicePrice", "৳" + Number(booking.price || 0).toLocaleString());
  setText("invoiceNights", booking.nights);
  setText("invoiceTotal", "৳" + Number(booking.total || 0).toLocaleString());
  setText("finalAmount", "৳" + Number(booking.total || 0).toLocaleString());
  setText("finalAmount2", "৳" + Number(booking.total || 0).toLocaleString());
  setText("invoicePaymentMethod", booking.paymentMethod || "N/A");
  setText("invoiceTransactionId", booking.transactionId || "N/A");
  setText("invoicePaymentStatus", booking.paymentStatus || "Pending");
}
