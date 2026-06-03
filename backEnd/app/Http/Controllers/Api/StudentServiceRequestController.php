<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentServiceRequestController extends Controller
{
    /**
     * Student-facing request types.
     * Keep these values synchronized with the React student portal serviceRequestTypes list.
     */
    private array $requestTypes = [
        'transcript_request',
        'enrollment_certificate',
        'personal_info_update',
        'financial_review',
        'attendance_review',
        'general_inquiry',
        'graduation_certificate',
        'student_card_replacement',
        'clearance_request',
        'exam_absence_excuse',
        'course_description_request',
        'registration_status_review',
        'course_add_request',
        'course_withdrawal_request',
        'major_change_request',
        'suspension_request',
        'reactivation_request',
        'official_attendance_statement',
    ];

    private array $statuses = [
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'completed',
        'cancelled',
    ];

    public function myRequests(Request $request): JsonResponse
    {
        $student = $this->currentStudent($request);

        if (!$student) {
            return response()->json([
                'message' => 'This account is not linked to a student profile.',
            ], 403);
        }

        $requests = StudentServiceRequest::with([
                'student.user',
                'submittedBy',
                'reviewedBy',
            ])
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        return response()->json([
            'service_requests' => $requests,
            'requests' => $requests,
        ]);
    }

    public function showMine(Request $request, int $requestId): JsonResponse
    {
        $student = $this->currentStudent($request);

        if (!$student) {
            return response()->json([
                'message' => 'This account is not linked to a student profile.',
            ], 403);
        }

        $serviceRequest = StudentServiceRequest::with([
                'student.user',
                'submittedBy',
                'reviewedBy',
            ])
            ->where('student_id', $student->id)
            ->findOrFail($requestId);

        return response()->json([
            'data' => $serviceRequest,
        ]);
    }

    public function submit(Request $request): JsonResponse
    {
        $student = $this->currentStudent($request);

        if (!$student) {
            return response()->json([
                'message' => 'This account is not linked to a student profile.',
            ], 403);
        }

        $validated = $request->validate([
            'request_type' => ['required', Rule::in($this->requestTypes)],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high'])],
            'metadata' => ['nullable', 'array'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
        ]);

        $attachmentData = [];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('student-service-requests', 'public');

            $attachmentData = [
                'attachment_path' => $path,
                'attachment_original_name' => $file->getClientOriginalName(),
                'attachment_mime_type' => $file->getClientMimeType(),
                'attachment_size' => $file->getSize(),
            ];
        }

        $serviceRequest = StudentServiceRequest::create(array_merge([
            'student_id' => $student->id,
            'submitted_by_user_id' => optional($request->user())->id,
            'request_type' => $validated['request_type'],
            'subject' => $validated['subject'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'] ?? 'normal',
            'metadata' => $validated['metadata'] ?? null,
            'status' => 'submitted',
        ], $attachmentData));

        return response()->json([
            'message' => 'Student service request submitted successfully.',
            'data' => $serviceRequest->load(['student.user', 'submittedBy', 'reviewedBy']),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $query = StudentServiceRequest::with([
            'student.user',
            'submittedBy',
            'reviewedBy',
        ])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('request_type')) {
            $query->where('request_type', $request->query('request_type'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->query('student_id'));
        }

        return response()->json($query->paginate(20));
    }

    public function show(int $requestId): JsonResponse
    {
        $serviceRequest = StudentServiceRequest::with([
            'student.user',
            'submittedBy',
            'reviewedBy',
        ])->findOrFail($requestId);

        return response()->json($serviceRequest);
    }

    public function updateStatus(Request $request, int $requestId): JsonResponse
    {
        $serviceRequest = StudentServiceRequest::findOrFail($requestId);

        $validated = $request->validate([
            'status' => ['required', Rule::in($this->statuses)],
            'staff_response' => ['nullable', 'string', 'max:5000'],
        ]);

        $serviceRequest->update([
            'status' => $validated['status'],
            'staff_response' => $validated['staff_response'] ?? $serviceRequest->staff_response,
            'reviewed_by_user_id' => optional($request->user())->id,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Student service request updated successfully.',
            'data' => $serviceRequest->fresh()->load(['student.user', 'submittedBy', 'reviewedBy']),
        ]);
    }

    public function cancel(Request $request, int $requestId): JsonResponse
    {
        $student = $this->currentStudent($request);

        if (!$student) {
            return response()->json([
                'message' => 'This account is not linked to a student profile.',
            ], 403);
        }

        $serviceRequest = StudentServiceRequest::where('id', $requestId)
            ->where('student_id', $student->id)
            ->firstOrFail();

        if (!in_array($serviceRequest->status, ['submitted', 'under_review'], true)) {
            return response()->json([
                'message' => 'Only submitted or under review requests can be cancelled.',
            ], 422);
        }

        $serviceRequest->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'Student service request cancelled successfully.',
            'data' => $serviceRequest->fresh()->load(['student.user', 'submittedBy', 'reviewedBy']),
        ]);
    }

    private function currentStudent(Request $request): ?Student
    {
        $user = $request->user();

        if (!$user) {
            return null;
        }

        return Student::where('user_id', $user->id)->first();
    }
}
