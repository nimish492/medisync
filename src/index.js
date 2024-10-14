$(document).ready(function () {
  // Fetch patient data from the server
  $.ajax({
      url: '/api/patients',
      method: 'GET',
      success: function (patients) {
          // Clear any existing content
          $('.patient-list').empty();
          $('.consultation-details').empty();
          $('.medicines-table').empty(); // Clear existing medicines

          // Function to format the date to DD-MM-YYYY
          function formatDate(dateString) {
              const date = new Date(dateString);
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
              const year = date.getFullYear();
              return `${day}-${month}-${year}`;
          }

          // Dynamically populate patient data
          patients.forEach(patient => {
              const formattedDob = formatDate(patient.dob);

              const patientElement = `
                  <div class="patient" data-id="${patient._id}">
                      <img src="${patient.image}" alt="Patient" width="50px" height="50px">
                      <div class="patient-info">
                          <h3>${patient.name}</h3>
                          <a href="${patient.reportLink}" class="report">Report</a>
                      </div>
                      <span class="status ${patient.status === 'On drip' ? 'ongoing' : 'offgoing'}">${patient.status}</span>
                  </div>
              `;
              $('.patient-list').append(patientElement);
          });

          // Handle click event for patient items
          $('.patient').click(function () {
              const patientId = $(this).data('id');

              // Find the clicked patient data
              const selectedPatient = patients.find(patient => patient._id === patientId);

              if (selectedPatient) {
                  const formattedDob = formatDate(selectedPatient.dob);

                  const patientDetails = `
                      <img src="${selectedPatient.image}" alt="Patient" width="100px" class="mainpatient">
                      <div class="details">
                          <p><b>${selectedPatient.name}</b> - ${selectedPatient.age} years (${formattedDob})</p>
                          <p><b>Symptoms:</b> ${selectedPatient.symptoms}</p>
                          <p><b>Diagnosis:</b> ${selectedPatient.diagnosis}</p>
                          <p><b>Physician:</b> ${selectedPatient.physician}</p>
                      </div>
                  `;
                  $('.consultation-details').html(patientDetails);

                  // Fetch medicines for the selected patient from the integrated array
                  const medicines = selectedPatient.medicines;

                  // Clear any existing medicines
                  $('.medicines-table').empty();

                  // Build the medicines table
                  let medicinesTable = `
                      <table class="medicines-table">
                          <thead>
                              <tr>
                                  <th>Name</th>
                                  <th>Dosage</th>
                                  <th>Frequency</th>
                                  <th>Duration</th>
                              </tr>
                          </thead>
                          <tbody>
                  `;
                  medicines.forEach(medicine => {
                      medicinesTable += `
                          <tr>
                              <td>${medicine.name}</td>
                              <td>${medicine.dosage}</td>
                              <td>${medicine.frequency}</td>
                              <td>${medicine.duration}</td>
                          </tr>
                      `;
                  });
                  medicinesTable += `
                          </tbody>
                      </table>
                  `;
                  $('.medicines-table').html(medicinesTable);
              }
          });

          // Optionally, trigger a click event on the first patient to show initial details
          if (patients.length > 0) {
              $('.patient').first().click();
          }
      },
      error: function (error) {
          console.error('Error fetching patient data:', error);
      }
  });
});
