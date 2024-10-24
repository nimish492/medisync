$(document).ready(function () {
    /// Function to fetch and display patient list//////////////////////////////////////////////////////////////////////////////////////
    function fetchPatients() {
        $.ajax({
            url: '/api/patients',
            method: 'GET',
            success: function (patients) {
                $('.patient-list').empty();

                patients.forEach(patient => {
                    const patientElement = `
                        <div class="patient" data-id="${patient._id}" )">
                            <img src="/${patient.image}" alt="Patient" width="50px" height="50px">
                            <div class="patient-info">
                                <h3>${patient.name}</h3>
                                <a href="${patient.reportLink}" class="report">Report</a>
                            </div>
                            <span class="status ${patient.status === 'On drip' ? 'ongoing' : 'offgoing'}">${patient.status}</span>
                            <button class="delete-patient" data-id="${patient._id}">Delete</button>
                        </div>
                    `;
                    $('.patient-list').append(patientElement);
                });

                // Attach delete button click event
                $('.delete-patient').on('click', function (e) {
                    e.stopPropagation(); // Prevent triggering other events (e.g., openModal)
                    const patientId = $(this).data('id');
                    if (confirm('Are you sure you want to delete this patient?')) {
                        deletePatient(patientId);
                    }
                });
            },
            error: function (error) {
                console.error('Error fetching patient data:', error);
            }
        });
    }













    ///// Function to delete a patient/////////////////////////////////////////////////////////////////////////////////////////////
    function deletePatient(patientId) {
        $.ajax({
            url: `/api/patients/${patientId}`,
            method: 'DELETE',
            success: function () {
                alert('Patient deleted successfully');
                fetchPatients();
            },
            error: function (error) {
                console.error('Error deleting patient:', error);
                alert('Error deleting patient.');
            }
        });
    }


    fetchPatients();




    /// Search functionality/////////////////////////////////////////////////////////////////////////////////////////////////////////
    $('#patient-search').on('input', function () {
        const searchTerm = $(this).val().toLowerCase();
        $('.patient').each(function () {
            const name = $(this).find('h3').text().toLowerCase();
            $(this).toggle(name.includes(searchTerm));
        });
    });









    ///////Show and close the form to add a new patient////////////////////////////////////////////////////////////////////////////
    $('#add-patient').click(function () {
        $('#patientFormModal').show();
    });


    window.closeFormModal = function () {
        $('#patientFormModal').hide();
    };













    ///////// Handle form submission for adding a new patient////////////////////////////////////////////////////////
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



        $.ajax({
            url: '/api/patients',
            method: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function () {
                alert('Patient added successfully!');
                fetchPatients();
                $('#patientForm')[0].reset();
                $('#medicine-table tbody').empty();
                $('#patientFormModal').hide();
            },
            error: function (error) {
                console.error('Error adding patient:', error);
                alert('Error adding patient.');
            }
        });
    });
});
