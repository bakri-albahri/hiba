<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentCourseGrade;
use App\Models\SupplementaryExamRequest;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplementaryExamController extends Controller
{
    public function eligibleCourses(int $studentId, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
        ]);

        $student = Student::with('user')->findOrFail($studentId);
        $currentUser = $request->user();

        if (!$currentUser || !$currentUser->student) {
            return response()->json([
                'message' => 'Only authenticated student accounts can view eligible supplementary courses.',
            ], 403);
        }

        if ((int) $currentUser->student->id !== (int) $student->id) {
            return response()->json([
                'message' => 'You can only view eligible supplementary courses for your own student account.',
            ], 403);
        }

        $academicYearId = $validated['academic_year_id'] ?? null;

        $activeRequestsByAcademicYear = SupplementaryExamRequest::query()
            ->where('student_id', $student->id)
            ->whereIn('status', ['submitted', 'approved'])
            ->selectRaw('academic_year_id, COUNT(*) AS total')
            ->groupBy('academic_year_id')
            ->pluck('total', 'academic_year_id');

        $enrollments = StudentCourseEnrollment::with([
                'course',
                'grade',
                'academicYear',
                'studyYear',
                'supplementaryExamRequests',
            ])
            ->where('student_id', $student->id)
            ->when($academicYearId, function ($query) use ($academicYearId) {
                $query->where('academic_year_id', $academicYearId);
            })
            ->whereHas('academicYear', function ($query) {
                // Supplementary registration is available only for an open academic year.
                // After closing, conditionally passed courses are treated as passed.
                $query->where('is_closed', false);
            })
            ->get();

        $eligibleEnrollments = $enrollments
            ->filter(function ($enrollment) use ($activeRequestsByAcademicYear) {
                if (!$enrollment->grade || $enrollment->grade->final_mark === null) {
                    return false;
                }

                $status = strtolower((string) ($enrollment->grade->result_status ?? ''));

                // Important academic rule:
                // conditionally_passed courses are considered passed after year closing,
                // so they must not be offered for supplementary exams in the next year.
                if (in_array($status, ['passed', 'conditionally_passed', 'supplementary_approved'], true)) {
                    return false;
                }

                $passMark = (float) ($enrollment->course?->pass_mark ?? 60);
                $finalMark = (float) $enrollment->grade->final_mark;

                // Rule: the student may request supplementary exam for any course
                // whose final mark is below the pass mark. In this system pass mark is 60.
                if ($finalMark >= $passMark) {
                    return false;
                }

                if ($enrollment->is_supplementary) {
                    return false;
                }

                $activeRequestsCount = (int) ($activeRequestsByAcademicYear[$enrollment->academic_year_id] ?? 0);
                if ($activeRequestsCount >= 4) {
                    return false;
                }

                $hasExistingSupplementaryRequest = $enrollment->supplementaryExamRequests
                    ->where('academic_year_id', (int) $enrollment->academic_year_id)
                    ->isNotEmpty();

                return !$hasExistingSupplementaryRequest;
            })
            ->values()
            ->map(function ($enrollment) use ($activeRequestsByAcademicYear) {
                $passMark = (float) ($enrollment->course?->pass_mark ?? 60);
                $activeRequestsCount = (int) ($activeRequestsByAcademicYear[$enrollment->academic_year_id] ?? 0);

                return [
                    'enrollment_id' => $enrollment->id,
                    'course_id' => $enrollment->course_id,
                    'course_code' => $enrollment->course?->code,
                    'course_name' => $enrollment->course?->name,
                    'final_mark' => $enrollment->grade?->final_mark,
                    'pass_mark' => $passMark,
                    'result_status' => $enrollment->grade?->result_status,
                    'semester_number' => $enrollment->semester_number,
                    'study_year' => $enrollment->studyYear?->name,
                    'study_year_id' => $enrollment->study_year_id,
                    'academic_year' => $enrollment->academicYear?->name,
                    'academic_year_id' => $enrollment->academic_year_id,
                    'is_academic_year_closed' => (bool) $enrollment->academicYear?->is_closed,
                    'is_carried' => $enrollment->is_carried,
                    'is_supplementary' => $enrollment->is_supplementary,
                    'active_requests_count_for_year' => $activeRequestsCount,
                    'remaining_requests_for_year' => max(0, 4 - $activeRequestsCount),
                    'eligibility_reason' => 'Final mark is below the pass mark within the open academic year.',
                ];
            });

        return response()->json([
            'student_id' => $student->id,
            'student_number' => $student->student_number,
            'academic_year_id' => $academicYearId,
            'max_requests_per_academic_year' => 4,
            'eligible_courses_count' => $eligibleEnrollments->count(),
            'eligible_courses' => $eligibleEnrollments,
        ]);
    }

    public function submitRequest(
        Request $request,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'student_course_enrollment_id' => ['required', 'exists:student_course_enrollments,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'student_note' => ['nullable', 'string'],
        ]);

        $student = Student::findOrFail($validated['student_id']);
        $currentUser = $request->user();

        if (!$currentUser || !$currentUser->student) {
            return response()->json([
                'message' => 'Only authenticated student accounts can submit supplementary exam requests.',
            ], 403);
        }

        if ((int) $currentUser->student->id !== (int) $student->id) {
            return response()->json([
                'message' => 'You can only submit supplementary exam requests for your own student account.',
            ], 403);
        }

        $enrollment = StudentCourseEnrollment::with(['grade', 'course', 'academicYear'])
            ->findOrFail($validated['student_course_enrollment_id']);

        if ((int) $enrollment->student_id !== (int) $student->id) {
            return response()->json([
                'message' => 'The selected enrollment does not belong to the selected student.',
            ], 422);
        }

        if ((int) $enrollment->academic_year_id !== (int) $validated['academic_year_id']) {
            return response()->json([
                'message' => 'The selected enrollment does not belong to the selected academic year.',
            ], 422);
        }

        if ($enrollment->academicYear?->is_closed) {
            return response()->json([
                'message' => 'Supplementary requests cannot be submitted for a closed academic year.',
            ], 422);
        }

        if (!$enrollment->grade || $enrollment->grade->final_mark === null) {
            return response()->json([
                'message' => 'This course does not have a final grade yet.',
            ], 422);
        }

        $status = strtolower((string) ($enrollment->grade->result_status ?? ''));

        if (in_array($status, ['passed', 'conditionally_passed', 'supplementary_approved'], true)) {
            return response()->json([
                'message' => 'This course is considered passed and is not eligible for supplementary exam registration.',
            ], 422);
        }

        $passMark = (float) ($enrollment->course?->pass_mark ?? 60);
        $finalMark = (float) $enrollment->grade->final_mark;

        if ($finalMark >= $passMark) {
            return response()->json([
                'message' => 'Only courses with final mark below the pass mark can be requested for supplementary exam.',
            ], 422);
        }

        if ($enrollment->is_supplementary) {
            return response()->json([
                'message' => 'This enrollment is already marked as supplementary.',
            ], 422);
        }

        $activeRequestsCount = SupplementaryExamRequest::where('student_id', $student->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->whereIn('status', ['submitted', 'approved'])
            ->count();

        if ($activeRequestsCount >= 4) {
            return response()->json([
                'message' => 'A student cannot register for more than 4 supplementary courses in the same academic year.',
            ], 422);
        }

        $existingRequest = SupplementaryExamRequest::where('student_course_enrollment_id', $enrollment->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'A supplementary request for this course already exists in this academic year.',
            ], 422);
        }

        $requestRow = SupplementaryExamRequest::create([
            'student_id' => $student->id,
            'student_course_enrollment_id' => $enrollment->id,
            'academic_year_id' => $validated['academic_year_id'],
            'status' => 'submitted',
            'student_note' => $validated['student_note'] ?? null,
        ]);

        $notificationService->sendToStudent(
            $student,
            'supplementary_request_submitted',
            'Supplementary Exam Request Submitted',
            'Your supplementary exam request for the course "' . ($enrollment->course?->name ?? 'Unknown Course') . '" has been submitted successfully.',
            [
                'supplementary_request_id' => $requestRow->id,
                'course_id' => $enrollment->course_id,
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'supplementary_exam_request_submitted',
            'supplementary_exam_request',
            $requestRow->id,
            'Supplementary Exam Request Submitted',
            'A student submitted a supplementary exam request.',
            null,
            [
                'student_id' => $student->id,
                'enrollment_id' => $enrollment->id,
                'academic_year_id' => $validated['academic_year_id'],
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Supplementary exam request submitted successfully.',
            'data' => $requestRow->load([
                'student.user',
                'enrollment.course',
                'academicYear',
            ]),
        ], 201);
    }

    public function index(): JsonResponse
    {
        $requests = SupplementaryExamRequest::with([
            'student.user',
            'enrollment.course',
            'academicYear',
            'reviewedBy',
        ])->latest()->paginate(20);

        return response()->json($requests);
    }

    public function show(int $requestId): JsonResponse
    {
        $requestRow = SupplementaryExamRequest::with([
            'student.user',
            'enrollment.course',
            'enrollment.grade',
            'academicYear',
            'reviewedBy',
        ])->findOrFail($requestId);

        return response()->json($requestRow);
    }

    public function approve(
        Request $request,
        int $requestId,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $requestRow = SupplementaryExamRequest::with([
            'student',
            'enrollment.course',
            'enrollment.grade',
            'enrollment.studyYear',
        ])->findOrFail($requestId);

        if ($requestRow->status === 'approved') {
            return response()->json([
                'message' => 'This request is already approved.',
            ], 422);
        }

        $validated = $request->validate([
            'exam_department_note' => ['nullable', 'string'],
        ]);

        $oldValues = [
            'status' => $requestRow->status,
            'original_enrollment_id' => $requestRow->student_course_enrollment_id,
        ];

        DB::transaction(function () use ($requestRow, $validated, $request) {
            $originalEnrollment = $requestRow->enrollment;
            $originalGrade = $originalEnrollment->grade;

            if (!$originalEnrollment || !$originalGrade) {
                throw new \RuntimeException('Original enrollment or grade is missing for this supplementary request.');
            }

            $existingSupplementaryEnrollment = StudentCourseEnrollment::where('student_id', $originalEnrollment->student_id)
                ->where('course_id', $originalEnrollment->course_id)
                ->where('academic_year_id', $requestRow->academic_year_id)
                ->where('is_supplementary', true)
                ->first();

            if ($existingSupplementaryEnrollment) {
                throw new \RuntimeException('A supplementary enrollment already exists for this course and academic year.');
            }

            $supplementaryEnrollment = StudentCourseEnrollment::create([
                'student_id' => $originalEnrollment->student_id,
                'course_id' => $originalEnrollment->course_id,
                'academic_year_id' => $requestRow->academic_year_id,
                'study_year_id' => $originalEnrollment->study_year_id,
                'semester_number' => $originalEnrollment->semester_number,
                'is_carried' => false,
                'is_supplementary' => true,
                'status' => 'supplementary_approved',
                'notes' => 'Created automatically after supplementary exam request approval. Original enrollment ID: ' . $originalEnrollment->id,
            ]);

            $supplementaryGrade = new StudentCourseGrade([
                'student_course_enrollment_id' => $supplementaryEnrollment->id,
                'coursework_mark' => $originalGrade->coursework_mark,
                'practical_mark' => $originalGrade->practical_mark,
                'exam_mark' => null,
                'final_mark' => StudentCourseGrade::calculateFinalMark(
                    $originalGrade->coursework_mark,
                    $originalGrade->practical_mark,
                    null
                ),
                'result_status' => 'pending',
                'is_locked' => false,
                'last_updated_at' => null,
            ]);

            $supplementaryGrade->save();

            $requestRow->update([
                'status' => 'approved',
                'exam_department_note' => $validated['exam_department_note'] ?? null,
                'reviewed_by_user_id' => optional($request->user())->id,
                'reviewed_at' => now(),
            ]);

            $originalEnrollment->update([
                'status' => 'completed',
                'notes' => trim(($originalEnrollment->notes ?? '') . ' Supplementary request approved under request ID ' . $requestRow->id . '.'),
            ]);
        });

        $notificationService->sendToStudent(
            $requestRow->student,
            'supplementary_request_approved',
            'Supplementary Exam Request Approved',
            'Your supplementary exam request for the course "' . ($requestRow->enrollment->course?->name ?? 'Unknown Course') . '" has been approved.',
            [
                'supplementary_request_id' => $requestRow->id,
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'supplementary_exam_request_approved',
            'supplementary_exam_request',
            $requestRow->id,
            'Supplementary Exam Request Approved',
            'A supplementary exam request was approved by exams department and a new supplementary enrollment was created.',
            $oldValues,
            [
                'status' => 'approved',
            ],
            [
                'student_id' => $requestRow->student_id,
                'enrollment_id' => $requestRow->student_course_enrollment_id,
            ],
            $request
        );

        return response()->json([
            'message' => 'Supplementary exam request approved successfully and a new supplementary enrollment was created.',
            'data' => $requestRow->fresh()->load([
                'student.user',
                'enrollment.course',
                'academicYear',
                'reviewedBy',
            ]),
        ]);
    }

    public function reject(
        Request $request,
        int $requestId,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $requestRow = SupplementaryExamRequest::with([
            'student',
            'enrollment.course',
        ])->findOrFail($requestId);

        if ($requestRow->status === 'rejected') {
            return response()->json([
                'message' => 'This request is already rejected.',
            ], 422);
        }

        $validated = $request->validate([
            'exam_department_note' => ['required', 'string'],
        ]);

        $requestRow->update([
            'status' => 'rejected',
            'exam_department_note' => $validated['exam_department_note'],
            'reviewed_by_user_id' => optional($request->user())->id,
            'reviewed_at' => now(),
        ]);

        $notificationService->sendToStudent(
            $requestRow->student,
            'supplementary_request_rejected',
            'Supplementary Exam Request Rejected',
            'Your supplementary exam request for the course "' . ($requestRow->enrollment->course?->name ?? 'Unknown Course') . '" has been rejected.',
            [
                'supplementary_request_id' => $requestRow->id,
                'exam_department_note' => $validated['exam_department_note'],
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'supplementary_exam_request_rejected',
            'supplementary_exam_request',
            $requestRow->id,
            'Supplementary Exam Request Rejected',
            'A supplementary exam request was rejected by exams department.',
            [
                'status' => 'submitted',
            ],
            [
                'status' => 'rejected',
            ],
            [
                'student_id' => $requestRow->student_id,
                'enrollment_id' => $requestRow->student_course_enrollment_id,
            ],
            $request
        );

        return response()->json([
            'message' => 'Supplementary exam request rejected successfully.',
            'data' => $requestRow->fresh()->load([
                'student.user',
                'enrollment.course',
                'academicYear',
                'reviewedBy',
            ]),
        ]);
    }
}
