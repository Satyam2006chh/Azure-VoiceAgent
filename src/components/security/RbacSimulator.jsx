import React from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  UserCheck,
} from 'lucide-react';

export const RbacSimulator = () => {
  const { userRole, setUserRole } = useApp();

  const mockJwts = {
    guest: {
      header: { alg: 'none', typ: 'JWT' },
      payload: {
        iss: 'https://login.microsoftonline.com/university-tenant',
        sub: 'anonymous-session-991',
        role: 'Guest.Public',
        aud: 'https://univ-assistant-api.azurewebsites.net',
        exp: 1773660000,
      },
    },
    student: {
      header: { alg: 'RS256', typ: 'JWT', kid: 'entra-key-2025' },
      payload: {
        iss: 'https://login.microsoftonline.com/university-tenant',
        sub: 'stu_4019_raman',
        name: 'Raman Bansal (Student)',
        email: 'r.bansal.22cs@university.edu.in',
        role: 'Student.Enrolled',
        department: 'CSE',
        semester: 6,
        cgpaAccess: true,
        feeReceiptsAccess: true,
        aud: 'https://univ-assistant-api.azurewebsites.net',
        exp: 1773663600,
      },
    },
    faculty: {
      header: { alg: 'RS256', typ: 'JWT', kid: 'entra-key-2025' },
      payload: {
        iss: 'https://login.microsoftonline.com/university-tenant',
        sub: 'fac_102_prof_sharma',
        name: 'Dr. A. K. Sharma (Faculty)',
        email: 'ak.sharma.cse@university.edu.in',
        role: 'Faculty.AcademicOfficer',
        department: 'CSE',
        gradeSubmissionAccess: true,
        curriculumEditAccess: true,
        aud: 'https://univ-assistant-api.azurewebsites.net',
        exp: 1773663600,
      },
    },
  };

  const currentJwt = mockJwts[userRole] || mockJwts.student;

  const permissionsMatrix = [
    { resource: 'Public Academic Regulations & Timetables', guest: true, student: true, faculty: true },
    { resource: 'Official Examination Dates & Fee Circulars', guest: true, student: true, faculty: true },
    { resource: 'Personal Attendance Calculation & Status', guest: false, student: true, faculty: true },
    { resource: 'Personal Semester Fee Dues & Receipts', guest: false, student: true, faculty: false },
    { resource: 'Internal Assessment Marks Entry & Moderation', guest: false, student: false, faculty: true },
    { resource: 'Disciplinary Committee Reports', guest: false, student: false, faculty: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Role Switcher Selector */}
      <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="#0078D4" />
          <span>Interactive Microsoft Entra ID Role Simulator</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1.25rem' }}>
          Select an identity persona to simulate how the Assistant dynamically verifies OAuth2 / OIDC claims before querying private endpoints:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[
            {
              role: 'guest',
              title: 'Guest / Public User',
              subtitle: 'Anonymous Session (No Entra ID Login)',
              desc: 'Restricted to public documents. Private student data is blocked.',
            },
            {
              role: 'student',
              title: 'Enrolled Student',
              subtitle: 'OAuth2 Authenticated (Student.Enrolled)',
              desc: 'Authorized to view personal attendance, fee balance, and download records.',
            },
            {
              role: 'faculty',
              title: 'Faculty / Academic Officer',
              subtitle: 'Entra ID Claim (Faculty.AcademicOfficer)',
              desc: 'Full access to academic syllabus, regulations, and student attendance overviews.',
            },
          ].map((item) => {
            const isSelected = userRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => setUserRole(item.role)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #0078D4' : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: isSelected ? '#0078D4' : '#0F172A' }}>
                    {item.title}
                  </span>
                  {isSelected && <span style={{ color: '#0078D4', fontWeight: 700 }}>● Active</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
                  {item.subtitle}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#334155', lineHeight: 1.4, marginTop: '4px' }}>
                  {item.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulated Live JWT Token Inspector */}
      <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
          <KeyRound size={18} color="#059669" />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>
            Simulated Decoded Microsoft Entra ID JWT Claims
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1rem' }}>
          Real-time bearer token claims passed to the backend on voice and text queries:
        </p>

        <div style={{ backgroundColor: '#0F172A', color: '#E2E8F0', padding: '1.25rem', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', overflowX: 'auto' }}>
          <div style={{ color: '#94A3B8', marginBottom: '4px' }}>// Decoded Token Header:</div>
          <div style={{ color: '#F472B6', marginBottom: '12px' }}>{JSON.stringify(currentJwt.header, null, 2)}</div>
          <div style={{ color: '#94A3B8', marginBottom: '4px' }}>// Decoded Token Claims Payload:</div>
          <div style={{ color: '#38BDF8' }}>{JSON.stringify(currentJwt.payload, null, 2)}</div>
        </div>
      </div>

      {/* Role Access Matrix */}
      <div className="card" style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>
          Resource Permissions & Enforcement Matrix
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', color: '#64748B' }}>Protected University Resource</th>
              <th style={{ padding: '8px 12px', color: '#64748B', textAlign: 'center' }}>Guest (Public)</th>
              <th style={{ padding: '8px 12px', color: '#64748B', textAlign: 'center' }}>Student (Enrolled)</th>
              <th style={{ padding: '8px 12px', color: '#64748B', textAlign: 'center' }}>Faculty / Staff</th>
            </tr>
          </thead>
          <tbody>
            {permissionsMatrix.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1E293B' }}>{row.resource}</td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {row.guest ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ ALLOW</span> : <span style={{ color: '#DC2626', fontWeight: 700 }}>✕ DENY</span>}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {row.student ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ ALLOW</span> : <span style={{ color: '#DC2626', fontWeight: 700 }}>✕ DENY</span>}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                  {row.faculty ? <span style={{ color: '#059669', fontWeight: 700 }}>✓ ALLOW</span> : <span style={{ color: '#DC2626', fontWeight: 700 }}>✕ DENY</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
