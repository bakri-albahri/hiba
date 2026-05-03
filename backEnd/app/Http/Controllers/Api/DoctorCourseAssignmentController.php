<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\DoctorCourseAssignment;
use App\Services\NotificationService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorCourseAssignmentController extends Controller
{
    public function index(): JsonResponse
    {
        $assignments = DoctorCourseAssignment::with([
            'doctor.user',
            'doctor.department',
            'course',
            'academicYear',
        ])->latest()->get();

        return response()->json($assignments);
    }

    public function store(
        Request $request,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'doctor_id' => ['required', 'exists:doctors,id'],
            'course_id' => ['required', 'exists:courses,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'semester_number' => ['required', 'integer', 'in:1,2'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $assignment = DoctorCourseAssignment::create([
            'doctor_id' => $validated['doctor_id'],
            'course_id' => $validated['course_id'],
            'academic_year_id' => $validated['academic_year_id'],
            'semester_number' => $validated['semester_number'],
            'is_primary' => $validated['is_primary'] ?? false,
        ]);

        $assignment->load([
            'doctor.user',
            'doctor.department',
            'course',
            'academicYear',
        ]);

        $notificationService->sendToUser(
            $assignment->doctor->user_id,
            null,
            'doctor_course_assignment_created',
            'New Teaching Assignment',
            'You have been assigned to teach the course "' . ($assignment->course?->name ?? 'Unknown Course') . '" for academic year "' . ($assignment->academicYear?->name ?? 'Unknown Year') . '".',
            [
                'assignment_id' => $assignment->id,
                'course_id' => $assignment->course_id,
                'academic_year_id' => $assignment->academic_year_id,
                'semester_number' => $assignment->semester_number,
                'is_primary' => $assignment->is_primary,
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'doctor_course_assignment_created',
            'doctor_course_assignment',
            $assignment->id,
            'Doctor Course Assignment Created',
            'A course was assigned to a doctor.',
            null,
            [
                'doctor_id' => $assignment->doctor_id,
                'course_id' => $assignment->course_id,
                'academic_year_id' => $assignment->academic_year_id,
                'semester_number' => $assignment->semester_number,
                'is_primary' => $assignment->is_primary,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Doctor course assignment created successfully.',
            'data' => $assignment,
        ], 201);
    }

    public function show(int $assignmentId): JsonResponse
    {
        $assignment = DoctorCourseAssignment::with([
            'doctor.user',
            'doctor.department',
            'course',
            'academicYear',
        ])->findOrFail($assignmentId);

        return response()->json($assignment);
    }

    public function update(
        Request $request,
        int $assignmentId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $assignment = DoctorCourseAssignment::findOrFail($assignmentId);

        $oldAssignmentData = [
            'doctor_id' => $assignment->doctor_id,
            'course_id' => $assignment->course_id,
            'academic_year_id' => $assignment->academic_year_id,
            'semester_number' => $assignment->semester_number,
            'is_primary' => $assignment->is_primary,
        ];

        $validated = $request->validate([
            'doctor_id' => ['sometimes', 'required', 'exists:doctors,id'],
            'course_id' => ['sometimes', 'required', 'exists:courses,id'],
            'academic_year_id' => ['sometimes', 'required', 'exists:academic_years,id'],
            'semester_number' => ['sometimes', 'required', 'integer', 'in:1,2'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $assignment->update([
            'doctor_id' => $validated['doctor_id'] ?? $assignment->doctor_id,
            'course_id' => $validated['course_id'] ?? $assignment->course_id,
            'academic_year_id' => $validated['academic_year_id'] ?? $assignment->academic_year_id,
            'semester_number' => $validated['semester_number'] ?? $assignment->semester_number,
            'is_primary' => array_key_exists('is_primary', $validated)
                ? $validated['is_primary']
                : $assignment->is_primary,
        ]);

        $freshAssignment = $assignment->fresh();

        $activityLogService->log(
            optional($request->user())->id,
            'doctor_course_assignment_updated',
            'doctor_course_assignment',
            $assignment->id,
            'Doctor Course Assignment Updated',
            'A doctor course assignment was updated.',
            $oldAssignmentData,
            [
                'doctor_id' => $freshAssignment->doctor_id,
                'course_id' => $freshAssignment->course_id,
                'academic_year_id' => $freshAssignment->academic_year_id,
                'semester_number' => $freshAssignment->semester_number,
                'is_primary' => $freshAssignment->is_primary,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Doctor course assignment updated successfully.',
            'data' => $freshAssignment->load([
                'doctor.user',
                'doctor.department',
                'course',
                'academicYear',
            ]),
        ]);
    }

    public function destroy(
        Request $request,
        int $assignmentId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $assignment = DoctorCourseAssignment::findOrFail($assignmentId);

        $oldAssignmentData = [
            'assignment_id' => $assignment->id,
            'doctor_id' => $assignment->doctor_id,
            'course_id' => $assignment->course_id,
            'academic_year_id' => $assignment->academic_year_id,
            'semester_number' => $assignment->semester_number,
            'is_primary' => $assignment->is_primary,
        ];

        $assignment->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'doctor_course_assignment_deleted',
            'doctor_course_assignment',
            $oldAssignmentData['assignment_id'],
            'Doctor Course Assignment Deleted',
            'A doctor course assignment was deleted.',
            $oldAssignmentData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Doctor course assignment deleted successfully.',
        ]);
    }

    public function listDoctorCourses(int $doctorId): JsonResponse
    {
        $doctor = Doctor::with([
            'user',
            'department',
            'courseAssignments.course',
            'courseAssignments.academicYear',
        ])->findOrFail($doctorId);

        return response()->json($doctor);
    }
}