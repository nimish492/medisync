$(document).ready(function () {
  const socket = io();

  let patients = [];
  const doctors = [
    { id: 1, name: "Dr. Priya Gupta" },
    { id: 2, name: "Dr. Venkatesh Reddy" },
    { id: 3, name: "Dr. Sara Gill" },
    { id: 4, name: "Dr. Prakash Khurana" },
    { id: 5, name: "Dr. Diya Gulati" },
  ];

  //////////// Fetch and display patient list///////////////////////
  function fetchPatients() {
    $.ajax({
      url: "/api/patients",
      method: "GET",
      success: function (fetchedPatients) {
        patients = fetchedPatients;
        $(".patient-list").empty();

        patients.forEach((patient) => {
          const patientElement = `
          <div class="patient" data-id="${patient._id}">
            <img src="/${patient.image}" alt="Patient" width="50px" height="50px">
            <div class="patient-info">
              <div class="name-report">
                <h3>${patient.name}</h3>
                <a href="${patient.reportLink}" class="report">Report</a>
              </div>
            </div>
            <button class="delete-patient" data-id="${patient._id}">Delete</button>
          </div>
        `;
          $(".patient-list").append(patientElement);
        });

        $(".patient").on("click", function (e) {
          e.stopPropagation();
          const patientId = $(this).data("id");
          const patient = patients.find((p) => p._id === patientId);
          openMedicineModal(patient);
        });

        $(".delete-patient").on("click", function (e) {
          e.stopPropagation();
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

  /////////////// Delete a patient///////////////////////////////
  function deletePatient(patientId) {
    $.ajax({
      url: `/api/patients/${patientId}`,
      method: "DELETE",
      success: function () {
        alert("Patient deleted successfully");
        fetchPatients();
        socket.emit("patient-deleted", patientId);
      },
      error: function (error) {
        if (error.status === 403) {
          alert(error.responseJSON.error);
        } else {
          console.error("Error deleting patient:", error);
          alert("Error deleting patient.");
        }
      },
    });
  }

  ////////////////// Remove medicine///////////////////////////
  $(document).on("click", ".remove-medicine", function () {
    const patientId = $(this).data("patient-id");
    const medicineIndex = $(this).data("medicine-index");
    const patient = patients.find((p) => p._id === patientId);

    if (patient) {
      if (medicineIndex === -1) {
        $(this).closest("tr").remove();
      } else {
        patient.medicines.splice(medicineIndex, 1);
        $.ajax({
          url: `/api/patients/${patient._id}/medicines`,
          method: "PUT",
          data: { medicines: patient.medicines },
          success: function (response) {
            const updatedPatient = response.patient;
            const updatedIndex = patients.findIndex(
              (p) => p._id === updatedPatient._id
            );
            if (updatedIndex !== -1) {
              patients[updatedIndex] = updatedPatient;
            }
            openMedicineModal(updatedPatient);
          },
          error: function (error) {
            if (error.status === 403) {
              alert(error.responseJSON.error);
            } else {
              console.error("Error deleting patient:", error);
              alert("Error deleting patient.");
            }
          },
        });
      }
    }
  });

  ////////////// Search functionality///////////////////////
  $("#patient-search").on("input", function () {
    const searchTerm = $(this).val().toLowerCase();
    $(".patient").each(function () {
      const name = $(this).find("h3").text().toLowerCase();
      $(this).toggle(name.includes(searchTerm));
    });
  });

  $("#add-patient").click(function () {
    $("#patientFormModal").show();
  });

  window.closeFormModal = function () {
    $("#patientFormModal").hide();
  };

  ////////// Populate physician dropdown////////////////
  function populatePhysicianDropdown() {
    const physicianSelect = $("#physician");
    physicianSelect.empty();
    physicianSelect.append('<option value="">Select a Physician</option>');

    doctors.forEach((doctor) => {
      physicianSelect.append(
        `<option value="${doctor.id}">${doctor.name}</option>`
      );
    });
  }
  populatePhysicianDropdown();

  //////////// Add new patient//////////////////////////////////
  $("#patientForm").on("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const selectedDoctorId = $("#physician").val();
    const selectedDoctor = doctors.find(
      (doctor) => doctor.id === parseInt(selectedDoctorId)
    );

    if (selectedDoctor) {
      formData.set("physician", selectedDoctor.name);
    }
    $.ajax({
      url: "/api/patients",
      method: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: function (newPatient) {
        alert("Patient added successfully!");
        fetchPatients();
        $("#patientForm")[0].reset();
        $("#patientFormModal").hide();
        socket.emit("patient-added", newPatient);
      },
      error: function (error) {
        if (error.status === 403) {
          alert(error.responseJSON.error);
        } else {
          console.error("Error adding patient:", error);
          alert("Error adding patient.");
        }
      },
    });
  });

  ////////////// Open medicine modal///////////////////////////////////////////////////////
  function openMedicineModal(patient) {
    $("#MedicineFormModal").show();
    const medicineTableBody = $("#medicine-table tbody");
    medicineTableBody.empty();

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

    $("#saveMedicinesButton").on("click", function () {
      const updatedMedicines = [];
      $("#medicine-table tbody tr").each(function () {
        const name = $(this).find(".medicine-name").val();
        const dosage = $(this).find(".medicine-dosage").val();
        if (name && dosage) {
          updatedMedicines.push({ name, dosage });
        }
      });

      $.ajax({
        url: `/api/patients/${patient._id}/medicines`,
        method: "PUT",
        data: { medicines: updatedMedicines },
        success: function () {
          fetchPatients();
          closeMedicineModal();
          socket.emit("medicines-updated", {
            _id: patient._id,
            medicines: updatedMedicines,
          });
        },
        error: function (error) {
          if (error.status === 403) {
            alert(error.responseJSON.error);
          } else {
            console.error("Error updating medicines:", error);
            alert("Error updating medicines.");
          }
        },
      });
    });
  }

  window.closeMedicineModal = function () {
    $("#MedicineFormModal").hide();
  };

  fetchPatients();

  ///////////////////// Socket events/////////////////////////////
  socket.on("patient-added", function (newPatient) {
    patients.push(newPatient);
    fetchPatients();
  });

  socket.on("patient-deleted", function (patientId) {
    patients = patients.filter((p) => p._id !== patientId);
    fetchPatients();
  });

  socket.on("medicines-updated", function (updatedPatient) {
    patients = patients.map((p) =>
      p._id === updatedPatient._id ? updatedPatient : p
    );
    fetchPatients();
  });
});
