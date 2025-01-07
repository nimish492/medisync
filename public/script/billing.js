$(document).ready(function () {
  $("#patient-search").on("input", function () {
    const searchTerm = $(this).val();

    if (searchTerm.length > 0) {
      $.ajax({
        url: "/api/search-patients",
        method: "GET",
        data: { q: searchTerm },
        success: function (data) {
          const dropdownList = $("#dropdown-list");
          dropdownList.empty(); // Clear previous results

          if (data.length > 0) {
            data.forEach(function (patient) {
              dropdownList.append(
                `<li data-id="${patient._id}">${patient.name}</li>`
              );
            });
            dropdownList.show(); // Show the dropdown
          } else {
            dropdownList.hide(); // Hide dropdown if no results
          }
        },
        error: function () {
          console.error("Error fetching patients.");
        },
      });
    } else {
      $("#dropdown-list").hide(); // Hide dropdown if input is empty
    }
  });

  // Hide dropdown when clicking outside
  $(document).click(function (e) {
    if (!$(e.target).closest(".search-bar").length) {
      $("#dropdown-list").hide();
    }
  });

  // Handle patient selection
  $(document).on("click", "#dropdown-list li", function () {
    const patientId = $(this).data("id");
    $("#patient-search").val($(this).text());
    $("#dropdown-list").hide();
    fetchPatientDetails(patientId);
  });

  function fetchPatientDetails(patientId) {
    $.ajax({
      url: `/api/patients/${patientId}`,
      method: "GET",
      success: function (patient) {
        // Render the forms for the selected patient
        $("#patient-details-section").html(`
                    <div class="patient-details-form">
                        <div class="scroll">
                            <form id="hospital-charges-form">
                                <h3>Hospitalization Charges</h3>
                                <label for="room-type">Room Type:</label>
                                <select id="room-type">
                                   <option value="general">General</option>
                                    <option value="private">Private</option>
                                    <option value="deluxe">Deluxe</option>
                                </select>

                                <label for="no-of-days">Number of Days:</label>
                                <input type="number" id="no-of-days" value="${
                                  patient.hospitalCharges
                                    ? patient.hospitalCharges.noOfDays || 0
                                    : 0
                                }" required>
                            </form>

                            <form id="medicines-charges-form">
                                <h3>Medicines Charges</h3>
                                <div id="medicines-list"></div>
                            </form>
                            <button id="save-hospital-charges">Generate Bill</button>
                        </div>
                    </div>
                `);

        // Populate medicines form
        const medicinesList = $("#medicines-list");
        patient.medicines.forEach((medicine) => {
          medicinesList.append(`
                        <div class="medicine-item">
                            <label>Medicine Name:</label>
                            <input type="text" class="medicine-name" value="${
                              medicine.name
                            }">

                            <label>Quantity:</label>
                            <input type="number" class="medicine-qty" value="${
                              medicine.qty || ""
                            }" required>
                        </div>
                    `);
        });

        $("#billing-details").html(` <h3>Billing Details</h3>
                            <p id="patient-id">ID: ${patient._id}</p>
                            <p id="patient-name">Name: ${patient.name}</p>
                            <p id="patient-age">Age:${patient.age}</p>
                            <p id="patient-physician">Physician:${patient.physician}</p>`);
        // Update billing section with patient details
      },
      error: function () {
        console.error("Error fetching patient details.");
      },
    });
  }

  // Save form data
  $(document).on("click", "#save-hospital-charges", function () {
    const hospitalCharges = {
      roomType: $("#room-type").val(),
      noOfDays: $("#no-of-days").val(),
    };
    updatePatientDetail("hospitalCharges", hospitalCharges);
  });

  $(document).on("click", "#save-medicines-charges", function () {
    const medicines = [];
    $("#medicines-list .medicine-item").each(function () {
      const name = $(this).find(".medicine-name").val();
      const qty = $(this).find(".medicine-qty").val();
      if (name && qty) {
        medicines.push({ name, qty });
      }
    });
    updatePatientDetail("medicines", medicines);
  });

  function updatePatientDetail(field, value) {
    const patientId = $("#dropdown-list li").data("id"); // Get current patient ID
    $.ajax({
      url: `/api/patients/${patientId}`,
      method: "PATCH",
      data: { [field]: value },
      success: function () {
        generateBill(); // Update the bill after saving
      },
      error: function () {
        console.error("Error updating patient details.");
      },
    });
  }

  function generateBill() {
    const hospitalCharges = {
      roomType: $("#room-type").val(),
      noOfDays: $("#no-of-days").val(),
    };

    const medicines = [];
    $("#medicines-list .medicine-item").each(function () {
      const name = $(this).find(".medicine-name").val();
      const qty = $(this).find(".medicine-qty").val();
      if (name && qty) {
        medicines.push({ name, qty });
      }
    });

    // Calculate costs
    let roomPrice = 0;
    switch (hospitalCharges.roomType) {
      case "deluxe":
        roomPrice = 5000;
        break;
      case "private":
        roomPrice = 3000;
        break;
      case "general":
        roomPrice = 1500;
        break;
    }

    const totalHospitalCharges = roomPrice * hospitalCharges.noOfDays;

    const medicinePricePerUnit = 50; // Assuming each unit of medicine costs 50
    const totalMedicinesCharges = medicines.reduce(
      (total, medicine) => total + medicine.qty * medicinePricePerUnit,
      0
    );

    // Update billing table
    $("#billing-data").html(`
      <div class="billing-print">
                            <table id="billing-table">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Details</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                <td>Hospital Charges</td>
                <td>Room Type: ${
                  hospitalCharges.roomType
                }, No. of Days: ${hospitalCharges.noOfDays}</td>
                <td>${totalHospitalCharges}</td>
            </tr>
            <tr>
                <td>Medicines Charges</td>
                <td>${medicines
                  .map((medicine) => `${medicine.name}: ${medicine.qty} units`)
                  .join(", ")}</td>
                <td>${totalMedicinesCharges}</td>
            </tr>
            <tr>
                <td><strong>Total</strong></td>
                <td></td>
                <td><strong>${
                  totalHospitalCharges + totalMedicinesCharges
                }</strong></td>
            </tr>
                                </tbody>
                                
                            </table>
            </div>
        `);
  }

  // Generate and print the bill when button is clicked
  $(document).on("click", "#print-bill-btn", function () {
    const billSection = $("#billing"); // Change this line
    const opt = {
      margin: 1,
      filename: "patient-bill.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().from(billSection[0]).set(opt).save();
  });
});
