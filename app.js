// Sample user data with prescriptions
const users = [
    {
        name: "John Smith",
        prescriptions: [
            {
                id: 1,
                medication: "Lisinopril",
                dosage: "10mg",
                frequency: "Once daily",
                times: ["08:00"],
                lastTaken: null
            },
            {
                id: 2,
                medication: "Metformin",
                dosage: "500mg",
                frequency: "Twice daily",
                times: ["08:00", "20:00"],
                lastTaken: null
            },
            {
                id: 3,
                medication: "Atorvastatin",
                dosage: "20mg",
                frequency: "Once daily at bedtime",
                times: ["22:00"],
                lastTaken: null
            }
        ]
    },
    {
        name: "Sarah Johnson",
        prescriptions: [
            {
                id: 4,
                medication: "Levothyroxine",
                dosage: "75mcg",
                frequency: "Once daily in morning",
                times: ["07:00"],
                lastTaken: null
            },
            {
                id: 5,
                medication: "Omeprazole",
                dosage: "20mg",
                frequency: "Once daily before breakfast",
                times: ["07:30"],
                lastTaken: null
            },
            {
                id: 6,
                medication: "Vitamin D3",
                dosage: "2000 IU",
                frequency: "Once daily",
                times: ["12:00"],
                lastTaken: null
            }
        ]
    },
    {
        name: "Michael Brown",
        prescriptions: [
            {
                id: 7,
                medication: "Amlodipine",
                dosage: "5mg",
                frequency: "Once daily",
                times: ["09:00"],
                lastTaken: null
            },
            {
                id: 8,
                medication: "Aspirin",
                dosage: "81mg",
                frequency: "Once daily",
                times: ["09:00"],
                lastTaken: null
            },
            {
                id: 9,
                medication: "Gabapentin",
                dosage: "300mg",
                frequency: "Three times daily",
                times: ["08:00", "16:00", "00:00"],
                lastTaken: null
            }
        ]
    }
];

// Current simulated time
let currentTime = new Date();

// Initialize the app
function init() {
    updateTimeDisplay();
    loadUser(0);
    
    // Event listeners
    document.getElementById('userSelect').addEventListener('change', (e) => {
        loadUser(parseInt(e.target.value));
    });
    
    document.getElementById('advanceTimeBtn').addEventListener('click', () => {
        advanceTime(8);
    });
}

// Update time display
function updateTimeDisplay() {
    const timeString = currentTime.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

// Advance time by hours
function advanceTime(hours) {
    currentTime = new Date(currentTime.getTime() + hours * 60 * 60 * 1000);
    updateTimeDisplay();
    const userIndex = parseInt(document.getElementById('userSelect').value);
    loadUser(userIndex);
}

// Load user data
function loadUser(userIndex) {
    const user = users[userIndex];
    document.getElementById('userName').textContent = user.name;
    
    const prescriptionsDiv = document.getElementById('prescriptions');
    prescriptionsDiv.innerHTML = '';
    
    // Check if any pills are due
    let anyDue = false;
    user.prescriptions.forEach(prescription => {
        if (isPillDue(prescription)) {
            anyDue = true;
        }
    });
    
    // Show alert if pills are due
    if (anyDue) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning';
        alert.innerHTML = '⚠️ <strong>Attention!</strong> You have medication(s) that need to be taken now.';
        prescriptionsDiv.appendChild(alert);
    }
    
    // Display each prescription
    user.prescriptions.forEach(prescription => {
        const card = createPrescriptionCard(prescription, userIndex);
        prescriptionsDiv.appendChild(card);
    });
}

// Check if pill is due
function isPillDue(prescription) {
    if (prescription.lastTaken) {
        const lastTakenTime = new Date(prescription.lastTaken);
        const timeSinceLastDose = (currentTime - lastTakenTime) / (1000 * 60 * 60); // hours
        
        // Check if enough time has passed since last dose
        const minHoursBetweenDoses = 24 / prescription.times.length;
        if (timeSinceLastDose < minHoursBetweenDoses - 1) {
            return false;
        }
    }
    
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Check if current time matches any scheduled time (within 1 hour window)
    for (const time of prescription.times) {
        const [schedHour, schedMinute] = time.split(':').map(Number);
        const schedTimeInMinutes = schedHour * 60 + schedMinute;
        
        // Allow 1 hour window before and after scheduled time
        if (Math.abs(currentTimeInMinutes - schedTimeInMinutes) <= 60) {
            return true;
        }
    }
    
    return false;
}

// Get next dose time
function getNextDoseTime(prescription) {
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    let nextTime = null;
    let minDiff = Infinity;
    
    for (const time of prescription.times) {
        const [schedHour, schedMinute] = time.split(':').map(Number);
        const schedTimeInMinutes = schedHour * 60 + schedMinute;
        
        let diff = schedTimeInMinutes - currentTimeInMinutes;
        if (diff < 0) {
            diff += 24 * 60; // Add 24 hours if time has passed today
        }
        
        if (diff < minDiff) {
            minDiff = diff;
            nextTime = time;
        }
    }
    
    return nextTime;
}

// Create prescription card
function createPrescriptionCard(prescription, userIndex) {
    const card = document.createElement('div');
    card.className = 'prescription-card';
    
    const isDue = isPillDue(prescription);
    if (isDue) {
        card.classList.add('due');
    }
    
    const nextDose = getNextDoseTime(prescription);
    
    card.innerHTML = `
        <div class="prescription-header">
            <div class="medication-name">${prescription.medication}</div>
            <span class="status ${isDue ? 'due' : prescription.lastTaken ? 'taken' : 'not-due'}">
                ${isDue ? '🔔 Time to Take' : prescription.lastTaken ? '✓ Taken' : 'Not Due'}
            </span>
        </div>
        <div class="dosage">💊 Dosage: ${prescription.dosage}</div>
        <div class="schedule">📅 Schedule: ${prescription.frequency}</div>
        <div class="schedule">⏰ Times: ${prescription.times.join(', ')}</div>
        <div class="next-dose">Next dose: ${nextDose}</div>
        ${prescription.lastTaken ? `<div class="last-taken">Last taken: ${new Date(prescription.lastTaken).toLocaleString()}</div>` : ''}
        <div class="prescription-actions">
            <button class="btn btn-success" onclick="markAsTaken(${userIndex}, ${prescription.id})" ${!isDue ? 'disabled' : ''}>
                ✓ Mark as Taken
            </button>
        </div>
    `;
    
    return card;
}

// Mark pill as taken
function markAsTaken(userIndex, prescriptionId) {
    const user = users[userIndex];
    const prescription = user.prescriptions.find(p => p.id === prescriptionId);
    
    if (prescription && isPillDue(prescription)) {
        prescription.lastTaken = currentTime.toISOString();
        loadUser(userIndex);
        
        // Show success message
        const prescriptionsDiv = document.getElementById('prescriptions');
        const successAlert = document.createElement('div');
        successAlert.className = 'alert alert-success';
        successAlert.innerHTML = `✓ <strong>Success!</strong> ${prescription.medication} marked as taken.`;
        prescriptionsDiv.insertBefore(successAlert, prescriptionsDiv.firstChild);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            successAlert.remove();
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Made with Bob
