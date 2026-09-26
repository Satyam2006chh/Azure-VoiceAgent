"""
Mock Database for the 4 Dynamic University Tools.
Provides structured data for University Overview, Library, Faculty, and Fee Deadlines.
"""

UNIVERSITY_OVERVIEW_DB = {
    "name": "Apex Institute of Technology & University (AITU)",
    "established": 1985,
    "founder": "Dr. V. K. Ramanathan & National Education Foundation",
    "motto": "Excellence in Innovation, Integrity in Action (विद्या सर्वार्थ साधिका)",
    "campus_size": "250 Acres Green Smart Campus, Equipped with 5G WiFi & Solar Microgrid",
    "accreditation": "NAAC Grade A++ (Score 3.82/4.0), NBA Accredited for all Engineering programs, AICTE & UGC Approved",
    "rankings": {
        "nirf_engineering_2025": "Rank #12 in India (NIRF Engineering)",
        "nirf_overall_2025": "Rank #18 in India (Overall University Category)",
        "qs_asia_rank_2025": "Rank #142 in QS Asia University Rankings",
        "the_impact_rank": "Rank #45 Globally for UN SDG 9 (Industry, Innovation & Infrastructure)"
    },
    "key_highlights": [
        "Over 15,000 enrolled students across Undergraduate, Postgraduate, and PhD streams.",
        "12 Advanced Research Centers of Excellence including Microsoft Cloud Innovation Hub, AI & Robotics Lab, and Semiconductor Cleanroom.",
        "94.8% Average Placement Record in 2024-25 with highest international CTC ₹58.5 LPA and average CTC ₹11.2 LPA.",
        "Over 250+ top global recruiting partners including Microsoft, Google, Amazon, TCS Research, Intel, and Infosys."
    ],
    "chancellor": "Prof. S. N. Joshi",
    "vice_chancellor": "Prof. (Dr.) Ananya Sen",
    "registrar": "Dr. M. K. Sharma",
    "contact_email": "admissions@university.edu.in / info@university.edu.in",
    "helpline": "+91-11-2879-4000 (Toll Free: 1800-11-4500)"
}

LIBRARY_CATALOG_DB = [
    {
        "book_id": "LIB-CS-101",
        "title": "Introduction to Algorithms (CLRS 4th Edition)",
        "author": "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
        "category": "Computer Science & Engineering",
        "total_copies": 25,
        "available_copies": 6,
        "floor": "2nd Floor - CS & IT Wing",
        "shelf_location": "Rack CS-04, Shelf 2",
        "digital_version_available": True,
        "digital_access_url": "https://library.university.edu.in/ebooks/clrs-4th"
    },
    {
        "book_id": "LIB-CS-102",
        "title": "Data Structures and Algorithms in Python",
        "author": "Michael T. Goodrich, Roberto Tamassia, Michael H. Goldwasser",
        "category": "Computer Science & Engineering",
        "total_copies": 20,
        "available_copies": 11,
        "floor": "2nd Floor - CS & IT Wing",
        "shelf_location": "Rack CS-02, Shelf 3",
        "digital_version_available": True,
        "digital_access_url": "https://library.university.edu.in/ebooks/dsa-python"
    },
    {
        "book_id": "LIB-AI-201",
        "title": "Artificial Intelligence: A Modern Approach (4th Edition)",
        "author": "Stuart Russell and Peter Norvig",
        "category": "Artificial Intelligence & Data Science",
        "total_copies": 18,
        "available_copies": 4,
        "floor": "2nd Floor - AI & Emerging Tech Section",
        "shelf_location": "Rack AI-01, Shelf 1",
        "digital_version_available": True,
        "digital_access_url": "https://library.university.edu.in/ebooks/aima-4th"
    },
    {
        "book_id": "LIB-ECE-301",
        "title": "Digital Signal Processing: Principles, Algorithms and Applications",
        "author": "John G. Proakis, Dimitris G. Manolakis",
        "category": "Electronics & Communication Engineering",
        "total_copies": 15,
        "available_copies": 8,
        "floor": "3rd Floor - Electrical & Electronics Wing",
        "shelf_location": "Rack EC-08, Shelf 4",
        "digital_version_available": False,
        "digital_access_url": None
    },
    {
        "book_id": "LIB-ME-401",
        "title": "Thermodynamics: An Engineering Approach (9th Edition)",
        "author": "Yunus A. Cengel, Michael A. Boles",
        "category": "Mechanical Engineering",
        "total_copies": 12,
        "available_copies": 5,
        "floor": "1st Floor - Mechanical & Civil Wing",
        "shelf_location": "Rack ME-05, Shelf 2",
        "digital_version_available": True,
        "digital_access_url": "https://library.university.edu.in/ebooks/cengel-thermo"
    }
]

FACULTY_DIRECTORY_DB = [
    {
        "faculty_id": "FAC-CSE-001",
        "name": "Dr. R. K. Sharma",
        "designation": "Professor & Head of Department (HOD)",
        "department": "Computer Science & Engineering",
        "cabin_location": "Academic Block A, 3rd Floor, Cabin A-312",
        "email": "rk.sharma@university.edu.in",
        "phone_extension": "4321",
        "office_hours": "Monday & Wednesday: 2:00 PM - 4:30 PM, Friday: 11:00 AM - 1:00 PM",
        "specialization": "Distributed Systems, Cloud Architecture & High Performance Computing"
    },
    {
        "faculty_id": "FAC-CSE-002",
        "name": "Dr. Priyanka Nair",
        "designation": "Associate Professor",
        "department": "Computer Science & Engineering (AI / ML)",
        "cabin_location": "Academic Block A, 3rd Floor, Cabin A-328",
        "email": "priyanka.nair@university.edu.in",
        "phone_extension": "4329",
        "office_hours": "Tuesday & Thursday: 10:00 AM - 12:30 PM",
        "specialization": "Deep Learning, Natural Language Processing & Conversational Agents"
    },
    {
        "faculty_id": "FAC-ECE-003",
        "name": "Prof. Amitava Ghosh",
        "designation": "Professor",
        "department": "Electronics & Communication Engineering",
        "cabin_location": "Academic Block B, 2nd Floor, Cabin B-205",
        "email": "a.ghosh@university.edu.in",
        "phone_extension": "4215",
        "office_hours": "Monday & Friday: 3:00 PM - 5:00 PM",
        "specialization": "VLSI Design, Embedded IoT Systems & FPGA Acceleration"
    },
    {
        "faculty_id": "FAC-ME-004",
        "name": "Dr. Sunita Deshmukh",
        "designation": "Dean of Student Welfare & Professor",
        "department": "Mechanical & Mechatronics Engineering",
        "cabin_location": "Administrative Block, Ground Floor, Room AD-104",
        "email": "dsw@university.edu.in / s.deshmukh@university.edu.in",
        "phone_extension": "4010",
        "office_hours": "Monday to Friday: 11:00 AM - 1:00 PM",
        "specialization": "Thermal Engineering, Fluid Dynamics & Student Welfare Governance"
    },
    {
        "faculty_id": "FAC-MATH-005",
        "name": "Dr. Harish Chandra Gupta",
        "designation": "Professor of Applied Mathematics",
        "department": "Applied Sciences & Humanities",
        "cabin_location": "Academic Block C, 1st Floor, Cabin C-114",
        "email": "hc.gupta@university.edu.in",
        "phone_extension": "4150",
        "office_hours": "Wednesday & Thursday: 1:30 PM - 3:30 PM",
        "specialization": "Linear Algebra, Complex Analysis & Numerical Methods"
    }
]

FEE_DEADLINES_DB = [
    {
        "fee_id": "FEE-SEM6-2026",
        "fee_type": "Semester 6 Exam & Regular Tuition Fee",
        "applicable_programs": "B.Tech (All Branches), MCA, BBA, BCA (Batch 2023-27)",
        "amount": 48500,
        "standard_due_date": "March 25, 2026",
        "late_fee_slabs": [
            {"period": "March 26, 2026 - March 31, 2026", "penalty_amount": 500},
            {"period": "April 01, 2026 - April 05, 2026", "penalty_amount": 1500},
            {"period": "After April 05, 2026", "penalty_amount": 3000, "warning": "Subject to Dean of Academic Affairs approval"}
        ],
        "payment_modes": "Net Banking, UPI, Debit/Credit Card, Demand Draft at Finance Counter",
        "portal_url": "https://erp.university.edu.in/fees/pay-online",
        "status": "Active / Open for Payment"
    },
    {
        "fee_id": "FEE-SUPPL-2026",
        "fee_type": "Odd/Even Supplementary & Backlog Exam Fee",
        "applicable_programs": "All Batches & Programs",
        "amount": 1000,
        "per_unit": "per theory / practical course",
        "standard_due_date": "April 10, 2026",
        "late_fee_slabs": [
            {"period": "April 11, 2026 - April 15, 2026", "penalty_amount": 300}
        ],
        "payment_modes": "ERP Student Portal Only",
        "portal_url": "https://erp.university.edu.in/examination/supplementary-pay",
        "status": "Active / Open for Payment"
    },
    {
        "fee_id": "FEE-HOSTEL-2026",
        "fee_type": "Hostel Mess & Boarding Fee (Spring Term)",
        "applicable_programs": "All Hostellers (Boys & Girls Hostels)",
        "amount": 32000,
        "standard_due_date": "February 28, 2026",
        "late_fee_slabs": [
            {"period": "March 01, 2026 onwards", "penalty_amount": 1000}
        ],
        "payment_modes": "Hostel Accounts Counter & Online ERP",
        "portal_url": "https://erp.university.edu.in/hostel/dues",
        "status": "Late Penalty Cycle Active"
    }
]
