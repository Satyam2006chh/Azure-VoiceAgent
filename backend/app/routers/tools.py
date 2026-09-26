"""
Direct University Tools Inspection & Execution Endpoints.
Allows individual tool testing and evaluation during vivas / presentations.
"""

from typing import Optional
from fastapi import APIRouter
from app.tools.university_tools import (
    get_university_overview_and_ranking,
    check_library_status,
    find_faculty_contact,
    check_fee_deadlines
)

router = APIRouter(prefix="/api/tools", tags=["University Tools Direct API"])

@router.get("/overview")
def get_overview(topic: Optional[str] = None):
    """Tool 1: University Overview & Ranking"""
    return get_university_overview_and_ranking(topic)

@router.get("/library")
def get_library(query: str = "Data Structures", category: Optional[str] = None):
    """Tool 2: Check Library Book Status & Racks"""
    return check_library_status(query, category)

@router.get("/faculty")
def get_faculty(name: Optional[str] = None, department: Optional[str] = None):
    """Tool 3: Faculty Cabin & Office Hours Directory"""
    return find_faculty_contact(name, department)

@router.get("/fees")
def get_fees(semester: Optional[int] = 6, fee_type: Optional[str] = None):
    """Tool 4: Fee Deadlines, Slabs & Online Payment Portal"""
    return check_fee_deadlines(semester, fee_type)

@router.get("/list")
def list_all_tools():
    """Returns directory of all available tools and schema"""
    return {
        "tools_count": 4,
        "tools": [
            {
                "id": "get_university_overview_and_ranking",
                "title": "University Overview, Accreditation & NIRF Ranking",
                "description": "Establishment (1985), NAAC A++ rating, NIRF #12 Engineering, Campus Highlights."
            },
            {
                "id": "check_library_status",
                "title": "Central Library Catalog & Shelf Finder",
                "description": "Live book copies, rack/shelf positions, floor wings, and digital e-book access."
            },
            {
                "id": "find_faculty_contact",
                "title": "Faculty Cabin & Office Hours Directory",
                "description": "Professors' cabin locations, departments, emails, and consultation hours."
            },
            {
                "id": "check_fee_deadlines",
                "title": "Semester Exam & Tuition Fee Schedules",
                "description": "Standard deadlines, late fee penalties, due dates, and ERP payment portal."
            }
        ]
    }
