import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  ArrowRight,
  Filter,
  Search,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { EditRequest } from '../types';

export const EditRequestsTab: React.FC = () => {
  const { editRequests, reviewEditRequest } = useAttendance();
  const { currentUser, canApproveEditRequests } = useAuth();

  const [activeFilter, setActiveFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal state
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewComment, setReviewComment] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const filteredRequests = editRequests.filter((req) => {
    const matchesFilter = activeFilter === 'all' || req.status === activeFilter;
    const matchesSearch =
      req.target_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requested_by_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.request_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason_for_edit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = editRequests.filter((r) => r.status === 'Pending').length;

  const openReviewModal = (req: EditRequest, decision: 'Approved' | 'Rejected') => {
    setSelectedRequest(req);
    setReviewDecision(decision);
    setReviewComment(
      decision === 'Approved'
        ? 'Verified with bus sign-in log and attendance roster. Approved.'
        : 'Discrepancy not substantiated by classroom supervisor records.'
    );
    setFeedbackError(null);
    setModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedRequest) return;
    if (!reviewComment || reviewComment.trim().length < 3) {
      setFeedbackError('A mandatory review justification or feedback comment is required.');
      return;
    }

    setIsSubmitting(true);
    const res = await reviewEditRequest(selectedRequest.id, reviewDecision, reviewComment);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackSuccess(res.message);
      setModalOpen(false);
      setTimeout(() => setFeedbackSuccess(null), 5000);
    } else {
      setFeedbackError(res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      {feedbackSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Role permission notice if current user cannot approve */}
      {!canApproveEditRequests && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-xs flex items-start space-x-3 text-amber-900">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Staff Role Notice ({currentUser?.role}): </span>
            You can monitor the status of submitted edit requests. Only Principals, Directors, and ICCE Coordinators have authority to approve or reject attendance alterations.
          </div>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <span>Attendance Edit Approval Requests</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse">
                  {pendingCount} Pending Review
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and audit proposed alterations to student and faculty attendance records.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('Pending')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === 'Pending'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('Approved')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === 'Approved'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('Rejected')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === 'Rejected'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by target name, request ID, requester, or reason..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Requests Cards List */}
        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs">No edit requests found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3.5 transition hover:shadow-sm"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      {req.target_type === 'Student' ? 'STU' : 'STF'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-slate-900">{req.target_name}</h4>
                        <span className="text-[10px] font-mono bg-white text-slate-500 px-1.5 py-0.2 rounded border border-slate-200">
                          {req.request_id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Log: {req.log_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Date: <strong>{req.date}</strong> • Requested By: <strong>{req.requested_by_name}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        req.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {req.status === 'Pending' && <Clock className="w-3 h-3 mr-1 animate-spin" />}
                      {req.status === 'Approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {req.status === 'Rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      <span>{req.status}</span>
                    </span>
                  </div>
                </div>

                {/* Reason for edit callout */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">Reason for Edit Submission: </span>
                  <span className="text-slate-900 italic">"{req.reason_for_edit}"</span>
                </div>

                {/* Side-by-side diff table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">
                        <th className="py-2 px-3">Field</th>
                        <th className="py-2 px-3 text-slate-500">Original Value</th>
                        <th className="py-2 px-3 text-blue-700 bg-blue-50/50">Proposed Replacement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-700">Check-In Time</td>
                        <td className="py-2 px-3 text-slate-600 line-through">
                          {req.original_data?.check_in_time || '—'}
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-700 bg-blue-50/30">
                          {req.proposed_data?.check_in_time || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-700">Check-Out Time</td>
                        <td className="py-2 px-3 text-slate-600">
                          {req.original_data?.check_out_time || '(None - On Premises)'}
                        </td>
                        <td className="py-2 px-3 font-bold text-blue-700 bg-blue-50/30">
                          {req.proposed_data?.check_out_time || '(None)'}
                        </td>
                      </tr>
                      {req.proposed_data?.pickup_dropoff_party && (
                        <tr>
                          <td className="py-2 px-3 font-semibold text-slate-700">Party Details</td>
                          <td className="py-2 px-3 text-slate-600">
                            {req.original_data?.pickup_dropoff_party
                              ? `${req.original_data.pickup_dropoff_party.type}: ${req.original_data.pickup_dropoff_party.name}`
                              : '—'}
                          </td>
                          <td className="py-2 px-3 font-bold text-blue-700 bg-blue-50/30">
                            {req.proposed_data.pickup_dropoff_party.type}: {req.proposed_data.pickup_dropoff_party.name}
                            {req.proposed_data.pickup_dropoff_party.notes && (
                              <span className="block text-[10px] font-normal text-slate-500">
                                Note: {req.proposed_data.pickup_dropoff_party.notes}
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                      {req.proposed_data?.early_departure_reason && (
                        <tr>
                          <td className="py-2 px-3 font-semibold text-slate-700">Early Departure</td>
                          <td className="py-2 px-3 text-slate-600">
                            {req.original_data?.early_departure_reason || '—'}
                          </td>
                          <td className="py-2 px-3 font-bold text-amber-700 bg-blue-50/30">
                            {req.proposed_data.early_departure_reason}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Review details if already processed */}
                {req.status !== 'Pending' && req.reviewed_by && (
                  <div className="bg-slate-100/80 p-2.5 rounded-lg text-[11px] text-slate-600 flex items-start space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">
                        {req.status} by: {req.reviewed_by}
                      </span>{' '}
                      at {req.reviewed_at ? new Date(req.reviewed_at).toLocaleTimeString() : ''}
                      {req.review_comment && (
                        <p className="text-slate-700 mt-0.5 italic">
                          "Feedback: {req.review_comment}"
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action buttons (only for Admin Roles) */}
                {req.status === 'Pending' && (
                  <div className="flex justify-end items-center space-x-2 pt-1 border-t border-slate-200">
                    {canApproveEditRequests ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openReviewModal(req, 'Rejected')}
                          className="px-3 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition"
                        >
                          Reject Request
                        </button>
                        <button
                          type="button"
                          onClick={() => openReviewModal(req, 'Approved')}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          Approve & Overwrite Log
                        </button>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Pending Principal or Director approval
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal for Approval / Rejection with mandatory justification */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div
              className={`p-4 text-white flex justify-between items-center ${
                reviewDecision === 'Approved' ? 'bg-emerald-900' : 'bg-rose-900'
              }`}
            >
              <h3 className="font-bold text-sm flex items-center space-x-2">
                {reviewDecision === 'Approved' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>
                  {reviewDecision === 'Approved'
                    ? 'Approve Attendance Edit'
                    : 'Reject Attendance Edit'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            {feedbackError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs border-b border-red-200">
                {feedbackError}
              </div>
            )}

            <div className="p-5 space-y-3.5 text-xs">
              <p className="text-slate-700">
                You are about to{' '}
                <strong
                  className={
                    reviewDecision === 'Approved' ? 'text-emerald-700' : 'text-rose-700'
                  }
                >
                  {reviewDecision.toUpperCase()}
                </strong>{' '}
                the edit request submitted by <strong>{selectedRequest.requested_by_name}</strong> for{' '}
                <strong>{selectedRequest.target_name}</strong>.
              </p>

              {reviewDecision === 'Approved' && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900 text-[11px]">
                  ✓ This action will update the official attendance log and record your administrative stamp in the audit trail.
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mandatory Administrative Feedback / Reason:
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Provide official review comments (required)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReview}
                className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50 ${
                  reviewDecision === 'Approved'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSubmitting
                  ? 'Submitting...'
                  : reviewDecision === 'Approved'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
