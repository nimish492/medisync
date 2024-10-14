$(document).ready(function () {
    // Function to fetch and display patient list
    function fetchPatients() {
        $.ajax({
            url: '/api/patients',
            method: 'GET',
            success: function (patients) {
                $('.patient-list').empty();

                function formatDate(dateString) {
                    const date = new Date(dateString);
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                }

                patients.forEach(patient => {
                    const patientElement = `
                        <div class="patient" data-id="${patient._id}" onclick="openModal('${patient._id}')">
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

            },
            error: function (error) {
                console.error('Error fetching patient data:', error);
            }
        });
    }

    // Call fetchPatients to load the list on page load
    fetchPatients();

    // Function to change patient status
    window.changeStatus = function (patientId, statusElement) {
        const currentStatus = $(statusElement).text();
        const newStatus = currentStatus === 'On drip' ? 'Off drip' : 'On drip';

        // Update the status in the UI
        $(statusElement).text(newStatus);
        $(statusElement).toggleClass('ongoing offgoing');

        // Optionally, send an update to the server
        $.ajax({
            url: `/api/patients/${patientId}`,
            method: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify({ status: newStatus }),
            success: function (response) {
                console.log('Status updated successfully');
            },
            error: function (error) {
                console.error('Error updating status:', error);
                // Revert status in case of error
                $(statusElement).text(currentStatus);
                $(statusElement).toggleClass('ongoing offgoing');
            }
        });
    };

    // Search functionality
    $('#patient-search').on('input', function () {
        const searchTerm = $(this).val().toLowerCase();
        $('.patient').each(function () {
            const name = $(this).find('h3').text().toLowerCase();
            $(this).toggle(name.includes(searchTerm));
        });
    });

    let originalPatientData = {}; // Object to store original values
    window.openModal = function (patientId) {
        $.ajax({
            url: `/api/patients/${patientId}`,
            type: 'GET',
            success: function (patient) {
                // Format date fields to YYYY-MM-DD
                const formattedDob = new Date(patient.dob).toISOString().split('T')[0];

                // Store original data when modal is opened
                originalPatientData = {
                    name: patient.name,
                    age: patient.age,
                    symptoms: patient.symptoms,
                    diagnosis: patient.diagnosis,
                    physician: patient.physician,
                    status: patient.status,
                    medicines: patient.medicines
                };

                // Populate the modal with patient data
                $('#patient-name').val(patient.name);
                $('#patient-age').val(patient.age);
                $('#patient-symptoms').val(patient.symptoms);
                $('#patient-diagnosis').val(patient.diagnosis);
                $('#patient-physician').val(patient.physician);
                $('#status-select').val(patient.status);

                // Generate editable rows for medicines
                const medicineRows = patient.medicines.map(med => `
                    <tr data-id="${med.id}">
                        <td><input type="text" class="form-control medicine-name" value="${med.name}"></td>
                        <td><input type="text" class="form-control medicine-dosage" value="${med.dosage}"></td>
                        <td><input type="text" class="form-control medicine-frequency" value="${med.frequency}"></td>
                        <td><input type="text" class="form-control medicine-duration" value="${med.duration}"></td>
                         <td><button class="delete-medicine-btn">Delete</button></td>
                    </tr>
                `).join('');
                $('#medicine-table tbody').html(medicineRows);


                // Show or hide the "Actions" column based on the presence of medicines


                $('#patientModal').data('id', patientId).show(); // Show the modal
            },
            error: function (xhr, status, error) {
                console.error('Error loading patient details:', xhr.status, xhr.statusText, error);
                alert('Error loading patient details.');
            }
        });
    };

    window.editPatient = function () {
        const patientId = $('#patientModal').data('id');

        // Collect only the changed fields
        const updatedData = {};

        // Perform validation
        const isValid = $('#patientModal').find('input[required]').toArray().every(input => $(input).val().trim() !== '');

        if (!isValid) {
            alert('Please fill out all required fields.');
            return;
        }

        if ($('#patient-name').val() !== originalPatientData.name) {
            updatedData.name = $('#patient-name').val();
        }
        if ($('#patient-dob').val() !== originalPatientData.dob) {
            updatedData.dob = $('#patient-dob').val();
        }
        if ($('#patient-age').val() !== originalPatientData.age) {
            updatedData.age = $('#patient-age').val();
        }
        if ($('#patient-symptoms').val() !== originalPatientData.symptoms) {
            updatedData.symptoms = $('#patient-symptoms').val();
        }
        if ($('#patient-diagnosis').val() !== originalPatientData.diagnosis) {
            updatedData.diagnosis = $('#patient-diagnosis').val();
        }
        if ($('#patient-physician').val() !== originalPatientData.physician) {
            updatedData.physician = $('#patient-physician').val();
        }
        if ($('#patient-lastChecked').val() !== originalPatientData.lastChecked) {
            updatedData.lastChecked = $('#patient-lastChecked').val();
        }
        if ($('#status-select').val() !== originalPatientData.status) {
            updatedData.status = $('#status-select').val();
        }

        // Collect updated medicines data
        const updatedMedicines = [];


        $('#medicine-table tbody tr').each(function () {
            const medicine = {
                name: $(this).find('.medicine-name').val(),
                dosage: $(this).find('.medicine-dosage').val(),
                frequency: $(this).find('.medicine-frequency').val(),
                duration: $(this).find('.medicine-duration').val(),
            };
            updatedMedicines.push(medicine);
        });

        // Compare updated medicines with original medicines
        if (JSON.stringify(updatedMedicines) !== JSON.stringify(originalPatientData.medicines)) {
            updatedData.medicines = updatedMedicines;
        }

        // If there are no changes, don't send the request
        if (Object.keys(updatedData).length === 0) {
            alert('No changes made.');
            return;
        }

        $.ajax({
            url: `/api/patients/${patientId}`,
            type: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(updatedData),
            success: function (response) {
                // Update only the changed fields in the frontend
                const patientElement = $(`.patient[data-id="${patientId}"]`);

                if (updatedData.name) {
                    patientElement.find('.patient-info h3').text(updatedData.name);
                }
                if (updatedData.status) {
                    const statusElement = patientElement.find('.status');
                    statusElement.text(updatedData.status);
                    statusElement.removeClass('ongoing offgoing').addClass(updatedData.status === 'On drip' ? 'ongoing' : 'offgoing');
                }
                // Handle medicines update on frontend (if needed)
                if (updatedData.medicines) {
                    // Update the medicines table in the modal
                    const medicineRows = updatedData.medicines.map(med => `
                        <tr>
                            <td>${med.name}</td>
                            <td>${med.dosage}</td>
                            <td>${med.frequency}</td>
                            <td>${med.duration}</td>
                        </tr>
                    `).join('');
                    $('#medicine-table tbody').html(medicineRows);
                }
                $('#patientModal').hide(); // Hide the details modal
            },
            error: function (error) {
                console.error('Error updating patient:', error);
                alert('Error updating patient.');
            }
        });
    };



    // Delete Patient Function
    window.deletePatient = function () {
        const patientId = $('#patientModal').data('id'); // Retrieve patient ID from modal data attribute

        if (!patientId) {
            alert('Patient ID is missing.');
            return;
        }

        if (confirm('Are you sure you want to delete this patient?')) {
            $.ajax({
                url: `/api/patients/${patientId}`,
                method: 'DELETE',
                success: function (response) {

                    fetchPatients(); // Refresh the patient list
                    $('#patientModal').hide(); // Hide the details modal
                },
                error: function (error) {
                    console.error('Error deleting patient:', error);
                    alert('Error deleting patient.');
                }
            });
        }
    };

    // Close Modals
    window.closeModal = function () {
        $('#patientModal').hide();
    };

    window.closeFormModal = function () {
        $('#patientFormModal').hide();
    };

    // Show the form to add a new patient
    $('#add-patient').click(function () {
        $('#patientFormModal').show();

    });

    $(document).ready(function () {

        $('#add-medicine-btn').on('click', function () {

            const newRow = `
                <tr>
                    <td><input type="text" class="medicine-name" placeholder="Name" required></td>
                    <td><input type="text" class="medicine-dosage" placeholder="Dosage" required></td>
                    <td><input type="text" class="medicine-frequency" placeholder="Frequency" required></td>
                    <td><input type="text" class="medicine-duration" placeholder="Duration" required></td>
                    <td><button class="delete-medicine-btn">Delete</button></td>
                </tr>`;
            $('#medicine-table tbody').append(newRow);
        });


        $('#edit-medicine-btn').on('click', function () {

            // Optional: Clear the form or perform other actions if needed
            $('#medicine-table tbody').find('tr:has(.medicine-name)').each(function () {
                $(this).find('input').val('');
            });
        });

        // Handle medicine deletion
        $('#medicine-table').on('click', '.delete-medicine-btn', function () {
            $(this).closest('tr').remove();

            // Hide the "Actions" column if no medicines are left
            if ($('#medicine-table tbody tr').length === 0) {
                $('#medicine-table th.action-column').hide();
            }
        });
    });


    // Handle form submission
    $('#patientForm').on('submit', function (e) {
        e.preventDefault();

        // Gather form data
        const formData = new FormData(this);

        // Gather medicines data from the form
        const medicines = [];
        $('#medicine-table tbody tr').each(function () {
            const medicine = {
                name: $(this).find('.medicine-name').val(),
                dosage: $(this).find('.medicine-dosage').val(),
                frequency: $(this).find('.medicine-frequency').val(),
                duration: $(this).find('.medicine-duration').val(),
            };
            medicines.push(medicine);
        });

        // Convert medicines array to JSON and append to formData
        formData.append('medicines', JSON.stringify(medicines));

        $.ajax({
            url: '/api/patients',
            method: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                alert('Patient added successfully!');
                fetchPatients(); // Refresh the patient list

                // Clear the form fields
                $('#patientForm')[0].reset();

                // Clear the medicines table
                $('#medicine-table tbody').empty();

                $('#patientFormModal').hide(); // Hide the form modal
            },
            error: function (error) {
                console.error('Error adding patient:', error);
                alert('Error adding patient.');
            }
        });
    });

});
