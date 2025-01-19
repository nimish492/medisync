$(document).ready(function () {
  let patients = [];
  /// Function to fetch and display patient list//////////////////////////////////////////////////////////////////////////////////////
  function fetchPatients() {
    $.ajax({
      url: "/api/patients",
      method: "GET",
      success: function (fetchedPatients) {
        patients = fetchedPatients;
        $(".patient-list").empty();

        patients.forEach((patient) => {
          const patientElement = `
                        <div class="patient" data-id="${patient._id}" )">
                            <img src="/${
                              patient.image
                            }" alt="Patient" width="50px" height="50px">
                            <div class="patient-info">
                                <h3>${patient.name}</h3>
                                <a href="${
                                  patient.reportLink
                                }" class="report">Report</a>
                            </div>
                            <span class="status ${
                              patient.status === "On drip"
                                ? "ongoing"
                                : "offgoing"
                            }">${patient.status}</span>
                            <button class="delete-patient" data-id="${
                              patient._id
                            }">Delete</button>
                        </div>
                    `;
          $(".patient-list").append(patientElement);
        });

        // Attach view medicines button click event
        $(".patient").on("click", function (e) {
          e.stopPropagation(); // Prevent triggering other events
          const patientId = $(this).data("id");
          const patient = patients.find((p) => p._id === patientId);
          openMedicineModal(patient);
        });

        // Attach delete button click event
        $(".delete-patient").on("click", function (e) {
          e.stopPropagation(); // Prevent triggering other events (e.g., openModal)
          const patientId = $(this).data("id");
          if (confirm("Are you sure you want to delete this patient?")) {
            deletePatient(patientId);
          }
        });
      },
      error: function (error) {
        console.error("Error fetching patient data:", error);
      },
    });
  }

  ///// Function to delete a patient/////////////////////////////////////////////////////////////////////////////////////////////
  function deletePatient(patientId) {
    $.ajax({
      url: `/api/patients/${patientId}`,
      method: "DELETE",
      success: function () {
        alert("Patient deleted successfully");
        fetchPatients();
      },
      error: function (error) {
        console.error("Error deleting patient:", error);
        alert("Error deleting patient.");
      },
    });
  }

  fetchPatients();
  //////////////////////////////////////////////////////
  // Function to remove medicine
  $(document).on("click", ".remove-medicine", function () {
    const patientId = $(this).data("patient-id");
    const medicineIndex = $(this).data("medicine-index");

    const patient = patients.find((p) => p._id === patientId);
    if (patient) {
      if (medicineIndex === -1) {
        // If it's a new row, remove it directly from the DOM
        $(this).closest("tr").remove();
      } else {
        // Remove from the medicines array (UI)
        patient.medicines.splice(medicineIndex, 1);

        // Update the backend by sending the modified medicines array
        $.ajax({
          url: `/api/patients/${patient._id}/medicines`,
          method: "PUT",
          data: { medicines: patient.medicines },
          success: function (response) {
            const updatedPatient = response.patient;
            const updatedPatientIndex = patients.findIndex(
              (p) => p._id === updatedPatient._id
            );
            if (updatedPatientIndex !== -1) {
              patients[updatedPatientIndex] = updatedPatient; // Update the local array
            }
            openMedicineModal(updatedPatient); // Refresh the modal with updated data
          },
          error: function (error) {
            console.error("Error updating medicines:", error);
            alert("Error removing medicine.");
          },
        });
      }
    }
  });

  /// Search functionality/////////////////////////////////////////////////////////////////////////////////////////////////////////
  $("#patient-search").on("input", function () {
    const searchTerm = $(this).val().toLowerCase();
    $(".patient").each(function () {
      const name = $(this).find("h3").text().toLowerCase();
      $(this).toggle(name.includes(searchTerm));
    });
  });

  ///////Show and close the form to add a new patient////////////////////////////////////////////////////////////////////////////
  $("#add-patient").click(function () {
    $("#patientFormModal").show();
  });

  window.closeFormModal = function () {
    $("#patientFormModal").hide();
  };

  // Static list of doctors (example)
  const doctors = [
    { id: "doctor1", name: "Dr. Priya Gupta" },
    { id: "doctor2", name: "Dr. Venkatesh Reddy" },
    { id: "doctor3", name: "Dr. Sara Gill" },
    { id: "doctor4", name: "Dr. Prakash Khurana" },
    { id: "doctor5", name: "Dr. Diya Gulati" },
  ];

  // Function to populate the physician dropdown
  function populatePhysicianDropdown() {
    const physicianSelect = $("#physician");
    physicianSelect.empty(); // Clear the existing options

    // Add the default "Select a Physician" option
    physicianSelect.append('<option value="">Select a Physician</option>');

    // Add each doctor as an option in the dropdown
    doctors.forEach((doctor) => {
      const option = `<option value="${doctor.id}">${doctor.name}</option>`;
      physicianSelect.append(option);
    });
  }

  // Call the function to populate the dropdown when the page loads
  populatePhysicianDropdown();

  ///////// Handle form submission for adding a new patient////////////////////////////////////////////////////////
  $("#patientForm").on("submit", function (e) {
    e.preventDefault();

    // Gather form data
    const formData = new FormData(this);

    // Get the selected doctor's name instead of the id
    const selectedDoctorId = $("#physician").val();
    const selectedDoctor = doctors.find(
      (doctor) => doctor.id === selectedDoctorId
    );

    // If a doctor is selected, add their name to the form data
    if (selectedDoctor) {
      formData.set("physician", selectedDoctor.name);
    }

    $.ajax({
      url: "/api/patients",
      method: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: function () {
        alert("Patient added successfully!");
        fetchPatients();
        $("#patientForm")[0].reset();
        $("#patientFormModal").hide();
      },
      error: function (error) {
        console.error("Error adding patient:", error);
        alert("Error adding patient.");
      },
    });
  });

  // Open the medicine modal for a specific patient
  function openMedicineModal(patient) {
    $("#MedicineFormModal").show();

    // Populate the medicine table dynamically
    const medicineTableBody = $("#medicine-table tbody");
    medicineTableBody.empty(); // Clear previous medicines

    // Add current medicines to the modal
    patient.medicines.forEach((medicine, index) => {
      const medicineRow = `
        <tr>
          <td><input type="text" class="medicine-name" value="${medicine.name}" data-index="${index}"></td>
          <td><input type="text" class="medicine-dosage" value="${medicine.dosage}" data-index="${index}"></td>
          <td>
            <button class="remove-medicine" data-patient-id="${patient._id}" data-medicine-index="${index}">Remove</button>
          </td>
        </tr>
      `;
      medicineTableBody.append(medicineRow);
    });

    // Ensure that the "Add Medicine" button only adds one new row
    $("#addMedicineButton")
      .off("click")
      .on("click", function () {
        const newRow = `
        <tr>
          <td><input type="text" class="medicine-name" placeholder="Medicine Name"></td>
          <td><input type="text" class="medicine-dosage" placeholder="Dosage"></td>
          <td>
            <button class="remove-medicine" data-patient-id="${patient._id}" data-medicine-index="-1">Remove</button>
          </td>
        </tr>
      `;
        medicineTableBody.append(newRow);
      });

    // Save medicines when clicked
    $("#saveMedicinesButton").on("click", function () {
      const updatedMedicines = [];

      // Collect updated medicines from the modal fields
      $("#medicine-table tbody tr").each(function () {
        const name = $(this).find(".medicine-name").val();
        const dosage = $(this).find(".medicine-dosage").val();

        if (name && dosage) {
          updatedMedicines.push({ name, dosage });
        }
      });

      // Send updated medicines to the server
      $.ajax({
        url: `/api/patients/${patient._id}/medicines`,
        method: "PUT",
        data: { medicines: updatedMedicines },
        success: function () {
          fetchPatients();
          closeMedicineModal(); // Close the modal after saving
        },
        error: function (error) {
          console.error("Error updating medicines:", error);
          alert("Error updating medicines.");
        },
      });
    });
  }

  // Close the medicine modal
  window.closeMedicineModal = function () {
    $("#MedicineFormModal").hide();
  };

  fetchPatients(); // Initially load the patients
});
