$(document).ready(function () {
    let lineChart1;




    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Fetch patient data from the server
    $.ajax({
        url: '/api/patients',
        method: 'GET',
        success: function (patients) {
            $('.patient-list').empty();
            $('.consultation-details').empty();
            $('.medicines-table').empty();


            $('.chart-container1').html('<canvas id="line-chart1"</canvas>');





            patients.forEach(patient => {
                const patientElement = `
                    <div class="patient" data-id="${patient._id}">
                        <img src="/${patient.image}" alt="Patient" width="50px" height="50px">
                        <div class="patient-info">
                            <h3>${patient.name}</h3>
                            <a href="${patient.reportLink}" class="report">Report</a>
                        </div>
                        <span class="status ${patient.status === 'On drip' ? 'ongoing' : 'offgoing'}">${patient.status}</span>
                    </div>
                `;
                $('.patient-list').append(patientElement);
            });







            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Handle click event for patient items
            $('.patient').click(function () {
                const patientId = $(this).data('id');



                const selectedPatient = patients.find(patient => patient._id === patientId);  // (Find the clicked patient data)

                if (selectedPatient) {
                    const patientDetails = `
                        <img src="/${selectedPatient.image}" alt="Patient" width="100px" class="mainpatient">
                        <div class="details">
                            <p><b>${selectedPatient.name}</b> - ${selectedPatient.age} years</p>
                            <p><b>Symptoms:</b> ${selectedPatient.symptoms}</p>
                            <p><b>Diagnosis:</b> ${selectedPatient.diagnosis}</p>
                            <p><b>Physician:</b> ${selectedPatient.physician}</p>
                        </div>
                    `;
                    $('.consultation-details').html(patientDetails);


                    const medicines = selectedPatient.medicines;


                    $('.medicines-table').empty();


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

                    const statuses = selectedPatient.status;








                    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    // Clear the chart containers for new data
                    $('.chart-container1').empty();
                    $('.chart-container1').html('<canvas id="line-chart1" </canvas>');

                    const ctx1 = document.getElementById('line-chart1').getContext('2d');

                    if (lineChart1) lineChart1.destroy();


                    if (statuses === "On drip") {
                        lineChart1 = new Chart(ctx1, {
                            type: 'line',
                            data: {
                                labels: ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'],
                                datasets: [{
                                    label: 'Normal saline',
                                    data: [100, 89, 72, 68, 55, 43, 30],
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 2,
                                    fill: false,
                                    pointBackgroundColor: ['rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)']
                                }]
                            },
                            options: {
                                responsive: false,
                                maintainAspectRatio: false,
                            }
                        });



                    } else if (statuses === "Off drip") {
                        $('.chart-container1').html('<p>No Data Available for Normal Saline Concentration</p>');

                    }

                }
            });


            if (patients.length > 0) {
                $('.patient').first().click();// (click event on the first patient to show initial details)
            }
        },
        error: function (error) {
            console.error('Error fetching patient data:', error);
        }
    });
});
