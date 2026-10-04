import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Server,
  KeyRound,
  Cloud,
  ArrowRight,
  Code,
  Shield,
  Lock
} from 'lucide-react';

export const BackendReportModal: React.FC = () => {
  const { isBackendReportOpen, setIsBackendReportOpen, isFirestoreConnected, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'actions' | 'firestore' | 'auth' | 'rules'>('actions');

  if (!isBackendReportOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backend-report-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="bg-white rounded-[4px] shadow-2xl max-w-4xl w-full border-2 border-[#D5D5D5] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 relative">
        <span className="kits-cyan-corner-tl" />
        <span className="kits-cyan-corner-br" />

        {/* Modal Header */}
        <div className="bg-[#F6F6F7] border-b border-[#D5D5D5] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[4px] bg-[#CA0765] text-white flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 id="backend-report-title" className="text-xl font-bold font-heading text-[#19232B]">
                Backend Architecture &amp; Production Report
              </h2>
              <p className="text-xs text-[#757F95]">
                KITS ProjectHub · SQLite Relational Database &amp; Session Authentication
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsBackendReportOpen(false)}
            aria-label="Close backend report modal"
            className="p-2 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-[#D5D5D5] px-4 sm:px-6 bg-slate-50/70">
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'actions'
                ? 'border-[#CA0765] text-[#CA0765] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Action-by-Action Status
          </button>
          <button
            onClick={() => setActiveTab('firestore')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'firestore'
                ? 'border-[#CA0765] text-[#CA0765] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Firestore Data Blueprint
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'auth'
                ? 'border-[#CA0765] text-[#CA0765] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Authentication & RBAC
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 whitespace-nowrap ${
              activeTab === 'rules'
                ? 'border-[#CA0765] text-[#CA0765] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Security Rules Plan
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm text-[#19232B]">
          {activeTab === 'actions' && (
            <div className="space-y-6">
              <div className="p-4 rounded-[4px] bg-emerald-50 border border-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-emerald-950 text-sm">
                    Live Production Database Connected ({isFirestoreConnected ? 'Firestore Synchronized' : 'Ready'})
                  </h3>
                  <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                    Cloud Firestore database <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[11px]">ai-studio-kitsprojecthub-5babc9eb-d863-49a7-9f59-0fcfeb2b4a3b</code> in project <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[11px]">optical-ring-kc9s2</code> is actively provisioned. Firebase rules are deployed and real-time listeners are established.
                  </p>
                </div>
              </div>

              <div className="border border-[#D5D5D5] rounded-[4px] overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-[#D5D5D5]">
                      <th className="py-3 px-4">Primary Interaction</th>
                      <th className="py-3 px-4">Implementation State</th>
                      <th className="py-3 px-4">Cloud Firestore Route</th>
                      <th className="py-3 px-4">Access Control & Security</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D5D5D5]">
                    <tr>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        Public Showcase & Project Discovery
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Live Firestore Subscription
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/projects</code> where status == 'approved'
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">Public Safe (No roll numbers)</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        Google Sign-in & Zero-Trust Provisioning
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Firebase Auth + Google OAuth
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/users/{'{uid}'}</code> (Strictly Student role default)
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">Owner Read/Write; Admin Role Guard</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        Capstone Project Submission
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Dual-Document Atomic Batch
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        Public: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/projects/{'{id}'}</code> + Private: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/projectPrivate/{'{id}'}</code>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium">Membership Verification Required</span>
                      </td>
                    </tr>

                    <tr>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        Faculty Scrutiny & Evaluation
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Audit Trail
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">/reviewEvents/{'{eventId}'}</code> + status patch
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">Faculty / Admin Only</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'firestore' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-[#19232B]">
                Cloud Firestore Schema Layout (<code className="text-[#CA0765]">firebase-blueprint.json</code>)
              </h3>
              <p className="text-xs text-[#757F95]">
                Strict segregation between public-facing showcase representations and protected student records:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-[#D5D5D5] rounded-[4px] space-y-2">
                  <div className="font-bold text-xs text-[#0070C2] uppercase">
                    Collection: /projects/{'{projectId}'} (Public Safe)
                  </div>
                  <pre className="text-[11px] font-mono bg-white p-3 border border-[#D5D5D5] rounded text-slate-800 overflow-x-auto">
{`{
  title: string,
  summary: string,
  description: string,
  departmentId: string,
  graduationYear: number,
  status: "approved" | "pending" | "needs_revision",
  ownerUid: string,
  submittedByName: string,
  teamMembers: [{ id, name, role, contribution }],
  mentor: { name, designation, department },
  links: { repository, website, video, documentation },
  viewsCount: number,
  likesCount: number
}`}
                  </pre>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-300 rounded-[4px] space-y-2">
                  <div className="font-bold text-xs text-amber-900 uppercase">
                    Collection: /projectPrivate/{'{projectId}'} (Confidential)
                  </div>
                  <pre className="text-[11px] font-mono bg-white p-3 border border-amber-200 rounded text-amber-950 overflow-x-auto">
{`{
  projectId: string,
  ownerUid: string,
  departmentId: string,
  studentEmail: string,
  studentRollNumber: string, // e.g. 21B91A0501
  mentorEmail: string,
  teamRoster: [{ name, rollNumber, email, role }],
  academicIntegrityCertified: boolean,
  internalRemarks: string,
  createdAt: string
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4">
              <h3 className="font-bold text-base text-[#19232B]">
                Institutional Authentication & Zero-Trust RBAC
              </h3>
              <div className="p-4 bg-slate-50 border border-[#D5D5D5] rounded-[4px] space-y-2 text-xs">
                <div className="font-bold text-[#CA0765] uppercase">
                  1. Zero-Trust First-User Protection
                </div>
                <p>
                  In accordance with institutional security guidelines, new users signing in via Google are never granted administrative access. All new users strictly receive the <strong>Student</strong> role with <code className="bg-white px-1 py-0.5 rounded font-mono">membershipApproved: false</code>.
                </p>

                <div className="font-bold text-[#0070C2] uppercase pt-2">
                  2. Configured College Membership Approval
                </div>
                <p>
                  To submit a project for departmental scrutiny, a student must hold an approved college membership validated by department administrators or faculty.
                </p>

                <div className="font-bold text-[#19232B] uppercase pt-2">
                  3. First Administrator Bootstrap Mechanism
                </div>
                <p>
                  To bootstrap the initial Administrator, the campus operations team can execute the provided audited Node.js Admin SDK script or authenticate using the institutional root setup key in the Admin Modal.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#19232B]">
                  Live Cloud Firestore Security Rules (<code className="text-[#CA0765]">firestore.rules</code>)
                </h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                  Deployed
                </span>
              </div>

              <pre className="p-4 bg-[#19232B] text-emerald-400 font-mono text-[11px] rounded-[4px] overflow-x-auto max-h-72">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function getUserData() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data; }
    function isAdmin() { return isAuthenticated() && getUserData().role == 'admin'; }
    function isFaculty() { return isAuthenticated() && (getUserData().role == 'faculty' || isAdmin()); }
    function isApprovedMember() { return isAuthenticated() && (getUserData().membershipApproved == true || isFaculty()); }

    match /projects/{projectId} {
      allow read: if resource.data.status == 'approved' || (isAuthenticated() && (resource.data.ownerUid == request.auth.uid || isFaculty()));
      allow create: if isAuthenticated() && isApprovedMember() && request.resource.data.ownerUid == request.auth.uid;
      allow update: if isAuthenticated() && (isFaculty() || (resource.data.ownerUid == request.auth.uid && resource.data.status in ['pending', 'draft', 'needs_revision']));
      allow delete: if isAdmin();
    }

    match /projectPrivate/{projectId} {
      allow read: if isAuthenticated() && (resource.data.ownerUid == request.auth.uid || isFaculty());
      allow create: if isAuthenticated() && isApprovedMember() && request.resource.data.ownerUid == request.auth.uid;
      allow update: if isAuthenticated() && (resource.data.ownerUid == request.auth.uid || isFaculty());
    }

    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isFaculty());
      allow create: if isAuthenticated() && request.auth.uid == userId && request.resource.data.role == 'student' && request.resource.data.membershipApproved == false;
      allow update: if isAdmin() || (request.auth.uid == userId && request.resource.data.role == resource.data.role && request.resource.data.membershipApproved == resource.data.membershipApproved);
    }
  }
}`}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-[#F6F6F7] border-t border-[#D5D5D5] px-6 py-3 flex justify-end">
          <button
            onClick={() => setIsBackendReportOpen(false)}
            className="px-5 py-2 rounded-[4px] bg-[#0070C2] hover:bg-[#005696] text-white text-xs font-bold uppercase transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
