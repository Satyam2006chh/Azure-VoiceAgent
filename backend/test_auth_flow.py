"""
End-to-End Test Suite for Identity Authentication, Email OTP, Quota & Audit Logging.
"""

import asyncio
from app.services.email_service import send_otp_email
from app.services.user_service import (
    create_and_store_otp,
    verify_and_register_otp,
    authenticate_user,
    create_jwt_token,
    decode_jwt_token,
    consume_query_quota,
    get_user_quota_info,
    log_audit_trail,
    get_audit_logs_summary
)

async def run_tests():
    print("=" * 60)
    print("UniVoice Security & Identity Verification Test Suite")
    print("=" * 60)

    # 1. Student Registration Flow (@chitkara.edu.in)
    student_email = "satyam3396.beai24@chitkara.edu.in"
    print(f"\n[Test 1] Initiating registration for Chitkara Student: {student_email}")
    otp, exp = create_and_store_otp(student_email, "Satyam Sharma", "StudentPass123!")
    print(f" -> OTP generated: {otp} (Expires in {exp}s)")

    # 2. Verify OTP
    print("\n[Test 2] Verifying OTP & generating student account...")
    valid, msg, student_user = verify_and_register_otp(student_email, otp)
    assert valid, f"OTP verification failed: {msg}"
    assert student_user["role"] == "student", f"Expected student role, got {student_user['role']}"
    assert student_user["daily_limit"] == 20, f"Expected 20 daily quota, got {student_user['daily_limit']}"
    print(f" -> Student registered successfully with {student_user['daily_limit']} daily queries.")

    # 3. Outside Visitor Registration Flow (@gmail.com)
    visitor_email = "satyamwwe47@gmail.com"
    print(f"\n[Test 3] Initiating registration for Visitor: {visitor_email}")
    v_otp, _ = create_and_store_otp(visitor_email, "Satyam Visitor", "VisitorPass123!")
    valid, msg, visitor_user = verify_and_register_otp(visitor_email, v_otp)
    assert valid, f"Visitor OTP verification failed: {msg}"
    assert visitor_user["role"] == "visitor", f"Expected visitor role, got {visitor_user['role']}"
    assert visitor_user["daily_limit"] == 5, f"Expected 5 daily quota, got {visitor_user['daily_limit']}"
    print(f" -> Visitor registered successfully with {visitor_user['daily_limit']} daily queries.")

    # 4. Fast Password Login
    print("\n[Test 4] Testing Fast Password Login without OTP...")
    ok, login_msg, user_obj = authenticate_user(student_email, "StudentPass123!")
    assert ok, f"Password login failed: {login_msg}"
    token = create_jwt_token(user_obj)
    decoded = decode_jwt_token(token)
    assert decoded["sub"] == student_email
    print(f" -> JWT issued & verified: sub={decoded['sub']}, role={decoded['role']}")

    # 5. Daily Quota Consumption
    print("\n[Test 5] Testing Daily Quota Consumption...")
    quota_before = get_user_quota_info(student_email)
    print(f" -> Initial Quota: {quota_before['remaining_today']} / {quota_before['daily_limit']}")
    has_quota, remaining = consume_query_quota(student_email)
    assert has_quota and remaining == 19
    print(f" -> After 1 Query: {remaining} remaining.")

    # 6. Audit Logging
    print("\n[Test 6] Testing Audit Trail Logging...")
    log_audit_trail(
        user_email=student_email,
        query_text="What is the passing criteria for semester 2?",
        query_type="text",
        intent="ORDINANCE_LOOKUP",
        tool_used="Azure AI Search RAG",
        is_out_of_scope=False,
        ip_address="127.0.0.1"
    )
    logs = get_audit_logs_summary(5)
    assert len(logs) > 0
    print(f" -> Audit log stored: latest entry user={logs[0]['user_email']}, intent={logs[0]['intent']}")

    print("\n" + "=" * 60)
    print("ALL 6 TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
