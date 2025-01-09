$(document).ready(function () {
  $(".nav-list-small i").on("click", function () {
    if ($(this).hasClass("bx-home-alt-2")) {
      window.location.href = "../html/index.html";
    } else if ($(this).hasClass("bxs-user-detail")) {
      window.location.href = "../html/patients.html";
    } else if ($(this).hasClass("bx-receipt")) {
      window.location.href = "../html/billing.html";
    } else if ($(this).hasClass("bx-log-out")) {
      window.location.href = "/logout";
    }
  });
});
