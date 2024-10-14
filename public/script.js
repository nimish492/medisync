$(document).ready(function () {
    let lineChart1, lineChart2; // Declare lineChart variables outside the click function
    let intervalId2; // Variables to hold the interval IDs for both charts

    var calendarEl = document.getElementById('calendar');
    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        editable: true, // Enables event dragging
        selectable: true // Enables selecting time slots
    });
    calendar.render();

    calendar.gotoDate(new Date());
    // Make the calendar resizable
    $('#calendar-container').resizable({
        alsoResize: '#calendar',
        stop: function () {
            calendar.updateSize(); // Update the calendar size after resizing
        }
    });




    // Fetch patient data from the server
    $.ajax({
        url: '/api/patients',
        method: 'GET',
        success: function (patients) {
            // Clear any existing content
            $('.patient-list').empty();
            $('.consultation-details').empty();
            $('.medicines-table').empty(); // Clear existing medicines
            
            // Reset the chart containers and add the canvases
            $('.chart-container1').html('<canvas id="line-chart1" width="400" height="200"></canvas>');
            $('.chart-container2').html('<canvas id="line-chart2" width="400" height="200"></canvas>');

            // Dynamically populate patient data
            patients.forEach(patient => {
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
                console.log("Clicked patient ID:", patientId);  // Debugging line

                // Find the clicked patient data
                const selectedPatient = patients.find(patient => patient._id === patientId);

                if (selectedPatient) {
                    const patientDetails = `
                        <img src="${selectedPatient.image}" alt="Patient" width="100px" class="mainpatient">
                        <div class="details">
                            <p><b>${selectedPatient.name}</b> - ${selectedPatient.age} years</p>
                            <p><b>Symptoms:</b> ${selectedPatient.symptoms}</p>
                            <p><b>Diagnosis:</b> ${selectedPatient.diagnosis}</p>
                            <p><b>Physician:</b> ${selectedPatient.physician}</p>
                        </div>
                    `;
                    $('.consultation-details').html(patientDetails);

                    // Fetch medicines for the selected patient
                    const medicines = selectedPatient.medicines;

                    // Clear existing medicines
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

                    // Get the patient's status
                    const statuses = selectedPatient.status;

                    // Clear the chart containers for new data
                    $('.chart-container1').empty();
                    $('.chart-container1').html('<canvas id="line-chart1" width="400" height="200"></canvas>');
                    $('.chart-container2').empty();
                    $('.chart-container2').html('<canvas id="line-chart2" width="400" height="200"></canvas>');

                    // Get the canvas context
                    const ctx1 = document.getElementById('line-chart1').getContext('2d');
                    const ctx2 = document.getElementById('line-chart2').getContext('2d');
                    var dataPoints = [30, 43, 55, 68, 72, 89, 91];

                    // Clear existing charts before creating new ones
                    if (lineChart1) lineChart1.destroy();
                    if (lineChart2) lineChart2.destroy();

                    // Create a new chart instance based on the patient's status
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
                                    pointBackgroundColor: ['rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)', 'rgba(75, 192, 192, 1)'],
                                }]
                            },
                            options: {
                                responsive: true, // Enable responsive resizing
                                maintainAspectRatio: false, // Prevent the chart from maintaining aspect ratio
                            }
                        });

                        lineChart2 = new Chart(ctx2, {
                            type: 'line',
                            data: {
                                labels: ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'],
                                datasets: [{
                                    label: 'Urine',
                                    data: dataPoints,
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 2,
                                    fill: false,
                                    pointBackgroundColor: dataPoints.map((value, index) => {
                                        return index === dataPoints.length - 1 ? 'red' : 'rgba(75, 192, 192, 1)';
                                    }),
                                    pointRadius: 5,
                                    pointHoverRadius: 5,
                                    pointBorderColor: 'transparent', // Remove the border
                                }]
                            },
                            options: {
                                responsive: false,
                                maintainAspectRatio: false,
                            }
                        });


                        // Blinking effect for lineChart2
                         setInterval(function () {
                            var currentColor = lineChart2.data.datasets[0].pointBackgroundColor[dataPoints.length - 1];
                            lineChart2.data.datasets[0].pointBackgroundColor[dataPoints.length - 1] =
                                currentColor === 'red' ? 'rgba(75, 192, 192, 1)' : 'red';

                            lineChart2.update();
                        }, 1000);

                    } else if (statuses === "Off drip") {
                        $('.chart-container1').html('<p>No Data Available for Normal Saline Concentration</p>');
                        $('.chart-container2').html('<p>No Data Available for Urine Concentration</p>');
                    }

                
                    
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
