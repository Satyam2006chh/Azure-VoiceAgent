"""
Official University Academic Ordinances and Policy Knowledge Base (RAG Documents).
Grounded sources for unstructured query retrieval.
"""

UNIVERSITY_RULEBOOK_DOCS = [
    {
        "id": "ORD-ACAD-01",
        "title": "Academic Attendance & Examination Eligibility Ordinance",
        "category": "academic_regulations",
        "section": "Section 4.1 - 4.3",
        "keywords": ["attendance", "minimum attendance", "75%", "medical leave", "shortage", "detention", "exam eligibility"],
        "content": (
            "Every registered student is required to maintain a minimum of 75% attendance in lectures, "
            "tutorials, and practicals separately in each enrolled course to be eligible to appear for the End-Semester Examination. "
            "A relaxation of up to 10% (i.e. minimum 65%) may be granted by the Dean of Academic Affairs exclusively on certified "
            "medical grounds (valid hospital discharge certificate/registered practitioner slip) or official university representation "
            "in sports/cultural/hackathon events, provided the application is submitted within 7 working days of recovery. "
            "Students having less than 65% attendance under any circumstances will receive an 'FA' (Fail due to Attendance) grade and "
            "must re-register for the course in the subsequent summer or regular semester."
        )
    },
    {
        "id": "ORD-ACAD-02",
        "title": "Branch / Specialization Change Rules for B.Tech (Post 1st Year)",
        "category": "branch_change",
        "section": "Section 2.4",
        "keywords": ["branch change", "change branch", "cse switch", "department change", "cgpa requirement", "eligibility"],
        "content": (
            "Students are eligible to apply for a change of branch at the end of the 2nd semester (1st year completion), subject to: "
            "1. The student must have passed all 1st and 2nd semester courses in the first attempt with zero backlog/incomplete grades. "
            "2. The student must possess a minimum cumulative CGPA of 8.50 at the end of the second semester. "
            "3. The branch change will be processed purely on a merit-based CGPA ranking against sanctioned vacant seats (maximum 10% "
            "increase in sanctioned intake of the receiving branch). Once allocated, branch change is irrevocable."
        )
    },
    {
        "id": "ORD-EXAM-03",
        "title": "Grading Scale, SGPA/CGPA Calculation, and Backlog Re-examination",
        "category": "grading_and_backlogs",
        "section": "Section 7.1 - 7.5",
        "keywords": ["grades", "grading system", "sgpa", "cgpa", "backlog", "re-evaluation", "supplementary exam", "rechecking"],
        "content": (
            "The university follows a 10-point relative grading scale: O (10, Outstanding), A+ (9, Excellent), A (8, Very Good), "
            "B+ (7, Good), B (6, Above Average), C (5, Average), P (4, Pass), F (0, Fail), FA (0, Attendance Shortage). "
            "SGPA is calculated as Sum(Course Credits * Grade Points) / Sum(Course Credits). "
            "A student with an 'F' grade in a theoretical course may register for the Supplementary Examination held before the start of the "
            "odd semester by paying a supplementary exam fee of ₹1,000 per paper. Re-evaluation applications must be submitted on the ERP portal "
            "within 14 days of result declaration with a re-checking fee of ₹750 per script."
        )
    },
    {
        "id": "ORD-HOSTEL-04",
        "title": "Hostel Residence Rules, Night Curfew, and Anti-Ragging Ordinance",
        "category": "hostel_and_discipline",
        "section": "Hostel Code of Conduct 2025-26",
        "keywords": ["hostel", "curfew", "night out", "anti ragging", "discipline", "mess", "gate timing", "warden permission"],
        "content": (
            "1. Campus Gate & Hostel Curfew: All hostel residents must return to their respective hostels by 9:30 PM on weekdays and "
            "10:30 PM on weekends/holidays. Biometric attendance is taken at hostel entry turnstiles. "
            "2. Night Out / Leave: Students wishing to stay outside or visit home must apply through the ERP Hostel Portal at least 24 hours "
            "in advance, requiring digital parent/guardian SMS approval followed by Chief Warden sign-off. "
            "3. Zero-Tolerance Anti-Ragging Policy: Ragging in any form (physical, verbal, psychological, cyber) is strictly prohibited as per "
            "UGC regulations. Any student found guilty faces immediate suspension, hostel rustication, and mandatory FIR registration."
        )
    },
    {
        "id": "ORD-ADMIS-05",
        "title": "Fee Refund & Admission Cancellation Policy (UGC Mandated)",
        "category": "admission_refund",
        "section": "Admission Policy Clause 5.2",
        "keywords": ["fee refund", "cancel admission", "seat withdrawal", "refund percentage", "security deposit"],
        "content": (
            "In accordance with UGC Fee Refund Guidelines: "
            "- 100% refund (less processing charge max ₹1,000): If notice of withdrawal is received 15 days or more before the officially notified last date of admission. "
            "- 90% refund: If withdrawal is received less than 15 days before the last date of admission. "
            "- 80% refund: If withdrawal is received within 15 days after the last date of admission. "
            "- 50% refund: If withdrawal is received between 16 to 30 days after the last date of admission. "
            "- 0% refund: If withdrawal is received more than 30 days after the last date of admission (only Caution Money / Security Deposit is refunded in full)."
        )
    },
    {
        "id": "ORD-LIB-06",
        "title": "Central Library Timings, Services & Digital Access Policy",
        "category": "library_services",
        "section": "Library Policy 2025-26",
        "keywords": ["library timings", "library open", "library hours", "library time", "reading room", "library close", "library schedule", "central library", "library when"],
        "content": (
            "Central Library (AITU) — Operating Hours & Services: "
            "Weekdays (Monday–Friday): 8:00 AM to 9:00 PM. "
            "Saturday: 9:00 AM to 5:00 PM. "
            "Sunday & Public Holidays: 10:00 AM to 2:00 PM (Reference Section only). "
            "During End-Semester Exams: Extended hours 7:30 AM to 10:00 PM on all weekdays. "
            "The Reading Room (2nd Floor) is open 24×7 for B.Tech and postgraduate students with valid student ID. "
            "Digital E-Library portal (library.university.edu.in) is accessible 24×7 with institutional login. "
            "Book issue limit: 3 books for UG students (14-day loan period), 5 books for PG/PhD (21-day loan period). "
            "Late return fine: ₹2 per book per day after the due date. Lost book replacement: full cost + 10% handling charges."
        )
    },
]
