<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoctorCourseAssignment;
use App\Models\GradeObjection;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradeObjectionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $objections = GradeObjection::with([
            'student.user',
            'enrollment.course',
            'enrollment.academicYear',
            'enrollment.studyYear',
            'enrollment.grade',
        ])->latest()->paginate(20);

        $objections->getCollection()->transform(function ($objection) {
            return $this->transformObjection($objection);
        });

        return response()->json($objections);
    }

    public function store(
        Request $request,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'student_course_enrollment_id' => ['required', 'exists:student_course_enrollments,id'],
            'objection_text' => ['required', 'string'],
            'objection_target' => ['required', 'in:coursework,practical,exam'],
        ]);

        $student = Student::findOrFail($validated['student_id']);
        $enrollment = StudentCourseEnrollment::with(['grade', 'course'])->findOrFail($validated['student_course_enrollment_id']);

        $currentUser = $request->user();

        if (!$currentUser || !$currentUser->student) {
            return response()->json([
                'message' => 'Only authenticated student accounts can submit grade objections.',
            ], 403);
        }

        if ((int) $currentUser->student->id !== (int) $student->id) {
            return response()->json([
                'message' => 'You can only submit grade objections for your own student account.',
            ], 403);
        }

        if ((int) $enrollment->student_id !== (int) $student->id) {
            return response()->json([
                'message' => 'The selected enrollment does not belong to the selected student.',
            ], 422);
        }

        if (!$enrollment->grade || $enrollment->grade->last_updated_at === null) {
            return response()->json([
                'message' => 'You cannot submit an objection for a course without a recorded grade.',
            ], 422);
        }

        $alreadyOpenObjection = GradeObjection::where('student_id', $student->id)
            ->where('student_course_enrollment_id', $enrollment->id)
            ->whereIn('status', [
                'submitted',
                'under_review',
                'sent_to_doctor',
                'doctor_responded',
            ])
            ->exists();

        if ($alreadyOpenObjection) {
            return response()->json([
                'message' => 'There is already an active objection for this course enrollment.',
            ], 422);
        }

        $objection = GradeObjection::create([
            'student_id' => $student->id,
            'student_course_enrollment_id' => $enrollment->id,
            'objection_text' => $validated['objection_text'],
            'objection_target' => $validated['objection_target'],
            'status' => 'submitted',
        ]);

        $notificationService->sendToStudent(
            $student,
            'grade_objection_submitted',
            'Grade Objection Submitted',
            'Your objection for the course "' . ($enrollment->course?->name ?? 'Unknown Course') . '" has been submitted successfully.',
            [
                'objection_id' => $objection->id,
                'course_id' => $enrollment->course_id,
                'objection_target' => $objection->objection_target,
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'grade_objection_submitted',
            'grade_objection',
            $objection->id,
            'Grade Objection Submitted',
            'A student submitted a grade objection.',
            null,
            [
                'student_id' => $student->id,
                'enrollment_id' => $enrollment->id,
                'course_id' => $enrollment->course_id,
                'status' => $objection->status,
                'objection_target' => $objection->objection_target,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Grade objection submitted successfully.',
            'data' => $this->transformObjection(
                $objection->load([
                    'student.user',
                    'enrollment.course',
                    'enrollment.grade',
                ])
            ),
        ], 201);
    }

    public function show(int $objectionId): JsonResponse
    {
        $objection = GradeObjection::with([
            'student.user',
            'enrollment.course',
            'enrollment.academicYear',
            'enrollment.studyYear',
            'enrollment.grade',
        ])->findOrFail($objectionId);

        return response()->json($this->transformObjection($objection));
    }

    public function markUnderReview(
        Request $request,
        int $objectionId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $objection = GradeObjection::findOrFail($objectionId);

        if (!in_array($objection->status, ['submitted', 'under_review'], true)) {
            return response()->json([
                'message' => 'Only newly submitted objections can be marked as under review.',
            ], 422);
        }

        $oldValues = [
            'status' => $objection->status,
        ];

        $objection->update([
            'status' => 'under_review',
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'grade_objection_marked_under_review',
            'grade_objection',
            $objection->id,
            'Grade Objection Marked Under Review',
            'A grade objection was marked as under review.',
            $oldValues,
            [
                'status' => $objection->fresh()->status,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Objection marked as under review.',
            'data' => $this->transformObjection(
                $objection->fresh()->load([
                    'student.user',
                    'enrollment.course',
                    'enrollment.grade',
                ])
            ),
        ]);
    }

    public function initialReview(
        Request $request,
        int $objectionId,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $objection = GradeObjection::with([
            'student.user',
            'student',
            'enrollment.course',
            'enrollment.grade',
        ])->findOrFail($objectionId);

        if (!in_array($objection->status, ['submitted', 'under_review'], true)) {
            return response()->json([
                'message' => 'Only submitted or under-review objections can receive an initial review decision.',
            ], 422);
        }

        $validated = $request->validate([
            'initial_decision' => ['required', 'in:approved,rejected'],
            'exam_department_note' => ['nullable', 'string'],
        ]);

        $oldValues = [
            'status' => $objection->status,
            'exam_department_note' => $objection->exam_department_note,
        ];

        if ($validated['initial_decision'] === 'approved') {
            $objection->update([
                'status' => 'sent_to_doctor',
                'exam_department_note' => $validated['exam_department_note'] ?? null,
            ]);

            $message = 'Objection reviewed by exams department and sent to the assigned doctor successfully.';
        } else {
            $objection->update([
                'status' => 'rejected_by_exams',
                'exam_department_note' => $validated['exam_department_note'] ?? null,
                'final_exam_decision_note' => $validated['exam_department_note'] ?? null,
            ]);

            $notificationService->sendToStudent(
                $objection->student,
                'grade_objection_result',
                'Grade Objection Rejected by Exams Department',
                'Your grade objection for the course "' . ($objection->enrollment->course?->name ?? 'Unknown Course') . '" was rejected by the exams department.',
                [
                    'objection_id' => $objection->id,
                    'final_decision' => 'rejected_by_exams',
                    'exam_department_note' => $objection->exam_department_note,
                    'objection_target' => $objection->objection_target,
                ]
            );

            $message = 'Objection reviewed and rejected by exams department.';
        }

        $activityLogService->log(
            optional($request->user())->id,
            'grade_objection_initial_review_completed',
            'grade_objection',
            $objection->id,
            'Grade Objection Initial Review Completed',
            'The exams department completed the initial review of a grade objection.',
            $oldValues,
            [
                'status' => $objection->fresh()->status,
                'exam_department_note' => $objection->fresh()->exam_department_note,
                'objection_target' => $objection->fresh()->objection_target,
            ],
            [
                'initial_decision' => $validated['initial_decision'],
                'student_id' => $objection->student_id,
            ],
            $request
        );

        return response()->json([
            'message' => $message,
            'data' => $this->transformObjection(
                $objection->fresh()->load([
                    'student.user',
                    'enrollment.course',
                    'enrollment.grade',
                ])
            ),
        ]);
    }

    public function doctorRespond(
        Request $request,
        int $objectionId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $objection = GradeObjection::with([
            'student',
            'enrollment.grade',
            'enrollment.course',
            'enrollment.academicYear',
        ])->findOrFail($objectionId);

        if ($objection->status !== 'sent_to_doctor') {
            return response()->json([
                'message' => 'Doctor response is only allowed after the exams department sends the objection to the doctor.',
            ], 422);
        }

        $currentUser = $request->user();

        if (!$currentUser || !$currentUser->doctor) {
            return response()->json([
                'message' => 'Only authenticated doctor accounts can respond to grade objections.',
            ], 403);
        }

        $doctorId = $currentUser->doctor->id;

        $isAssignedDoctor = DoctorCourseAssignment::where('doctor_id', $doctorId)
            ->where('course_id', $objection->enrollment->course_id)
            ->where('academic_year_id', $objection->enrollment->academic_year_id)
            ->exists();

        if (!$isAssignedDoctor) {
            return response()->json([
                'message' => 'You are not assigned to this course in the related academic year, so you cannot respond to this objection.',
            ], 403);
        }

        $validated = $request->validate([
            'doctor_response' => ['required', 'string'],
            'doctor_suggested_coursework_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'doctor_suggested_practical_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'doctor_suggested_exam_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $oldValues = [
            'status' => $objection->status,
            'doctor_response' => $objection->doctor_response,
            'doctor_suggested_coursework_mark' => $objection->doctor_suggested_coursework_mark,
            'doctor_suggested_practical_mark' => $objection->doctor_suggested_practical_mark,
            'doctor_suggested_exam_mark' => $objection->doctor_suggested_exam_mark,
        ];

        $objection->update([
            'doctor_response' => $validated['doctor_response'],
            'doctor_suggested_coursework_mark' => $validated['doctor_suggested_coursework_mark'] ?? null,
            'doctor_suggested_practical_mark' => $validated['doctor_suggested_practical_mark'] ?? null,
            'doctor_suggested_exam_mark' => $validated['doctor_suggested_exam_mark'] ?? null,
            'status' => 'doctor_responded',
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'grade_objection_doctor_response_saved',
            'grade_objection',
            $objection->id,
            'Grade Objection Doctor Response Saved',
            'The assigned doctor submitted a response to the grade objection.',
            $oldValues,
            [
                'status' => $objection->fresh()->status,
                'doctor_response' => $objection->fresh()->doctor_response,
                'doctor_suggested_coursework_mark' => $objection->fresh()->doctor_suggested_coursework_mark,
                'doctor_suggested_practical_mark' => $objection->fresh()->doctor_suggested_practical_mark,
                'doctor_suggested_exam_mark' => $objection->fresh()->doctor_suggested_exam_mark,
                'objection_target' => $objection->fresh()->objection_target,
            ],
            [
                'student_id' => $objection->student_id,
            ],
            $request
        );

        return response()->json([
            'message' => 'Doctor response saved successfully and sent back to the exams department.',
            'data' => $this->transformObjection(
                $objection->fresh()->load([
                    'student.user',
                    'enrollment.course',
                    'enrollment.grade',
                ])
            ),
        ]);
    }

    public function finalDecision(
        Request $request,
        int $objectionId,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $objection = GradeObjection::with([
            'student.user',
            'student',
            'enrollment.grade',
            'enrollment.course',
        ])->findOrFail($objectionId);

        if ($objection->status !== 'doctor_responded') {
            return response()->json([
                'message' => 'Final exams decision is only allowed after the doctor sends a response.',
            ], 422);
        }

        if (!$objection->enrollment || !$objection->enrollment->grade) {
            return response()->json([
                'message' => 'No grade record was found for the selected objection.',
            ], 422);
        }

        $validated = $request->validate([
            'final_decision' => ['required', 'in:approved,rejected'],
            'final_exam_decision_note' => ['nullable', 'string'],
            'coursework_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'practical_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'exam_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $oldValues = [
            'status' => $objection->status,
            'final_exam_decision_note' => $objection->final_exam_decision_note,
            'current_grade' => [
                'coursework_mark' => $objection->enrollment->grade->coursework_mark,
                'practical_mark' => $objection->enrollment->grade->practical_mark,
                'exam_mark' => $objection->enrollment->grade->exam_mark,
                'final_mark' => $objection->enrollment->grade->final_mark,
            ],
        ];

        DB::transaction(function () use ($objection, $validated) {
            if ($validated['final_decision'] === 'approved') {
                $gradeUpdates = [
                    'is_locked' => false,
                    'last_updated_at' => now(),
                ];

                if (array_key_exists('coursework_mark', $validated) && $validated['coursework_mark'] !== null) {
                    $gradeUpdates['coursework_mark'] = $validated['coursework_mark'];
                }

                if (array_key_exists('practical_mark', $validated) && $validated['practical_mark'] !== null) {
                    $gradeUpdates['practical_mark'] = $validated['practical_mark'];
                }

                if (array_key_exists('exam_mark', $validated) && $validated['exam_mark'] !== null) {
                    $gradeUpdates['exam_mark'] = $validated['exam_mark'];
                }

                if (
                    $objection->objection_target === 'coursework'
                    && !isset($gradeUpdates['coursework_mark'])
                    && $objection->doctor_suggested_coursework_mark !== null
                ) {
                    $gradeUpdates['coursework_mark'] = $objection->doctor_suggested_coursework_mark;
                }

                if (
                    $objection->objection_target === 'practical'
                    && !isset($gradeUpdates['practical_mark'])
                    && $objection->doctor_suggested_practical_mark !== null
                ) {
                    $gradeUpdates['practical_mark'] = $objection->doctor_suggested_practical_mark;
                }

                if (
                    $objection->objection_target === 'exam'
                    && !isset($gradeUpdates['exam_mark'])
                    && $objection->doctor_suggested_exam_mark !== null
                ) {
                    $gradeUpdates['exam_mark'] = $objection->doctor_suggested_exam_mark;
                }

                $objection->enrollment->grade->update($gradeUpdates);

                $objection->update([
                    'status' => 'approved',
                    'final_exam_decision_note' => $validated['final_exam_decision_note'] ?? null,
                ]);
            } else {
                $objection->update([
                    'status' => 'rejected',
                    'final_exam_decision_note' => $validated['final_exam_decision_note'] ?? null,
                ]);
            }
        });

        $notificationService->sendToStudent(
            $objection->student,
            'grade_objection_result',
            $validated['final_decision'] === 'approved'
                ? 'Grade Objection Approved'
                : 'Grade Objection Rejected',
            $validated['final_decision'] === 'approved'
                ? 'Your grade objection for the course "' . ($objection->enrollment->course?->name ?? 'Unknown Course') . '" has been approved by the exams department.'
                : 'Your grade objection for the course "' . ($objection->enrollment->course?->name ?? 'Unknown Course') . '" has been rejected by the exams department.',
            [
                'objection_id' => $objection->id,
                'final_decision' => $validated['final_decision'],
                'final_exam_decision_note' => $validated['final_exam_decision_note'] ?? null,
                'objection_target' => $objection->objection_target,
            ]
        );

        $freshObjection = $objection->fresh()->load([
            'student.user',
            'enrollment.course',
            'enrollment.grade',
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'grade_objection_final_decision_completed',
            'grade_objection',
            $objection->id,
            'Grade Objection Final Decision Completed',
            'The exams department issued the final decision on a grade objection.',
            $oldValues,
            [
                'status' => $freshObjection->status,
                'final_exam_decision_note' => $freshObjection->final_exam_decision_note,
                'objection_target' => $freshObjection->objection_target,
                'updated_grade' => [
                    'coursework_mark' => $freshObjection->enrollment?->grade?->coursework_mark,
                    'practical_mark' => $freshObjection->enrollment?->grade?->practical_mark,
                    'exam_mark' => $freshObjection->enrollment?->grade?->exam_mark,
                    'final_mark' => $freshObjection->enrollment?->grade?->final_mark,
                ],
            ],
            [
                'student_id' => $objection->student_id,
                'final_decision' => $validated['final_decision'],
            ],
            $request
        );

        return response()->json([
            'message' => 'Final exams decision saved successfully.',
            'data' => $this->transformObjection($freshObjection),
        ]);
    }

    private function transformObjection(GradeObjection $objection): array
    {
        return [
            'id' => $objection->id,
            'student_id' => $objection->student_id,
            'student' => $objection->student,
            'student_course_enrollment_id' => $objection->student_course_enrollment_id,
            'enrollment' => $objection->enrollment,
            'objection_text' => $objection->objection_text,
            'objection_target' => $objection->objection_target,
            'objection_target_label' => $this->mapObjectionTargetLabel($objection->objection_target),
            'status' => $objection->status,
            'exam_department_note' => $objection->exam_department_note,
            'doctor_response' => $objection->doctor_response,
            'doctor_suggested_coursework_mark' => $objection->doctor_suggested_coursework_mark,
            'doctor_suggested_practical_mark' => $objection->doctor_suggested_practical_mark,
            'doctor_suggested_exam_mark' => $objection->doctor_suggested_exam_mark,
            'final_exam_decision_note' => $objection->final_exam_decision_note,
            'submitted_at' => $objection->submitted_at,
            'created_at' => $objection->created_at,
            'updated_at' => $objection->updated_at,
        ];
    }

    private function mapObjectionTargetLabel(?string $target): ?string
    {
        return match ($target) {
            'coursework' => 'Coursework Mark',
            'practical' => 'Practical Mark',
            'exam' => 'Exam Mark',
            default => null,
        };
    }
}