const express = require('express');
const router = express.Router();
const Patient = require('../models/patient');
const multer = require('multer');
const path = require('path');



// Setup multer for file upload////////////////////////////////////////////////////////////////////////////
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'assets'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });








// Get all patients///////////////////////////////////////////////////////////////////////////////////
router.get('/patients', async (req, res) => {
    try {
        const patients = await Patient.find();
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching patients.' });
    }
});





// Add a new patient////////////////////////////////////////////////////////////////////////
router.post('/patients', upload.single('image'), async (req, res) => {
    try {
        const newPatientData = {
            name: req.body.name,
            age: req.body.age,
            symptoms: req.body.symptoms,
            diagnosis: req.body.diagnosis,
            physician: req.body.physician,
            status: req.body.status || 'Off drip',
            image: req.file ? `assets/${req.file.filename}` : 'assets/default.png',
            medicines: req.body.medName.map((name, index) => ({
                name,
                dosage: req.body.dosage[index],
                frequency: req.body.frequency[index],
                duration: req.body.duration[index]
            }))
        };

        const newPatient = new Patient(newPatientData);
        await newPatient.save();
        res.status(201).json(newPatient);
    } catch (error) {
        res.status(500).json({ error: 'Error adding patient.' });
    }
});






// Delete a patient//////////////////////////////////////////////////////
router.delete('/patients/:id', async (req, res) => {
    try {
        const result = await Patient.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: 'Patient deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Patient not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error deleting patient.' });
    }
});






// Search patients/////////////////////////////////////////////////////////////////
router.get('/search-patients', async (req, res) => {
    try {
        const searchTerm = req.query.q;
        const patients = await Patient.find({
            name: { $regex: searchTerm, $options: 'i' }
        }).select('name');

        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: 'Error searching patients.' });
    }
});

module.exports = router;
