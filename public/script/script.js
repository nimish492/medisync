$(document).ready(function () {
  let lineChart;
  const socket = io();

  let patients = [];
  // Function to create patient element
  function createPatientElement(patient) {
    return `
      <div class="patient" data-id="${patient._id}">
          <img src="/${patient.image}" alt="Patient" width="50px" height="50px">
          <div class="patient-info">
            <div class="name-report">
              <h3>${patient.name}</h3>
              <a href="${patient.reportLink}" class="report">Report</a>
            </div>
          </div>
          <span class="status ${
            patient.status === "On drip" ? "ongoing" : "offgoing"
          }">${patient.status}</span>
      </div>
    `;
  }

  // Function to display patient details
  function displayPatientDetails(selectedPatient) {
    const patientDetails = `
      <img src="/${selectedPatient.image}" alt="Patient" width="100px" class="mainpatient">
      <div class="details">
          <p><b>${selectedPatient.name}</b> - ${selectedPatient.age} years</p>
          <p><b>Symptoms:</b> ${selectedPatient.symptoms}</p>
          <p><b>Diagnosis:</b> ${selectedPatient.diagnosis}</p>
          <p><b>Physician:</b> ${selectedPatient.physician}</p>
      </div>
    `;
    $(".patient-details").html(patientDetails);
  }

  // Function to display medicines table
  function displayMedicines(medicines) {
    let medicinesTable = `
      <table class="medicines-table">
          <thead>
              <tr>
                  <th>Name</th>
                  <th>Dosage</th>
              </tr>
          </thead>
          <tbody>
    `;
    medicines.forEach((medicine) => {
      medicinesTable += `
        <tr>
            <td>${medicine.name}</td>
            <td>${medicine.dosage}</td>
        </tr>
      `;
    });
    medicinesTable += `
      </tbody>
    </table>
    `;
    $(".medicines-table").html(medicinesTable);
  }

  // Function to create and display chart
  function createChart(statuses) {
    $(".chart-container").empty().html('<canvas id="line-chart"></canvas>');
    const ctx1 = document.getElementById("line-chart").getContext("2d");

    if (lineChart) lineChart.destroy();

    if (statuses === "On drip") {
      lineChart = new Chart(ctx1, {
        type: "line",
        data: {
          labels: ["9am", "10am", "11am", "12pm", "1pm", "2pm", "3pm"],
          datasets: [
            {
              label: "Normal saline",
              data: [100, 89, 72, 68, 55, 43, 30],
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
              pointBackgroundColor: Array(7).fill("rgba(75, 192, 192, 1)"),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      });
    } else if (statuses === "Off drip") {
      $(".chart-container").html(
        "<p>No Data Available for Normal Saline Concentration</p>"
      );
    }
  }

  // Fetch patient data from the server
  function fetchPatients() {
    $.ajax({
      url: "/api/patients",
      method: "GET",
      success: function (serverPatients) {
        patients = serverPatients;
        $(".patient-list").empty();
        $(".patient-details").empty();
        $(".medicines-table").empty();
        $(".chart-container").html('<canvas id="line-chart"></canvas>');

        serverPatients.forEach((patient) => {
          $(".patient-list").append(createPatientElement(patient));
        });

        $(".patient-list").on("click", ".patient", function () {
          const patientId = $(this).data("id");
          const selectedPatient = patients.find(
            (patient) => patient._id === patientId
          );

          if (selectedPatient) {
            displayPatientDetails(selectedPatient);
            displayMedicines(selectedPatient.medicines);
            createChart(selectedPatient.status);
          }
        });

        // Trigger click on the first patient by default
        if (patients.length > 0) {
          $(".patient").first().click();
        }
      },
      error: function (error) {
        console.error("Error fetching patient data:", error);
      },
    });
  }
  // Socket events for real-time updates
  socket.on("patient-added", function (newPatient) {
    patients.push(newPatient); // Add new patient to the array
    $(".patient-list").append(createPatientElement(newPatient));
  });

  socket.on("patient-deleted", function (patientId) {
    patients = patients.filter((p) => p._id !== patientId); // Remove patient from array
    $(`.patient[data-id="${patientId}"]`).remove();

    $(".patient-details").empty();
    $(".medicines-table").empty();
    $(".chart-container").html("<p>No Data Available</p>");
  });

  socket.on("medicines-updated", function (updatedPatient) {
    const patientIndex = patients.findIndex(
      (p) => p._id === updatedPatient._id
    );
    if (patientIndex !== -1) {
      patients[patientIndex].medicines = updatedPatient.medicines;
    }
    displayMedicines(updatedPatient.medicines);
  });

  fetchPatients();
});
