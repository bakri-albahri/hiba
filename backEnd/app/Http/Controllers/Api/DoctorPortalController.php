<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\DoctorCourseAssignment;
use App\Models\GradeObjection;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorPortalController extends Controller
{
    private function currentDoctor(Request $request)
    {
        $user = $request->user()->loadMissing([
            'doctor.user',
            'doctor.department',
            'doctor.managedDepartment',
        ]);

        if (!$user->doctor) {
            abort(response()->json([
                'message' => 'Only authenticated doctor accounts can access this portal.',
            ], 403));
        }

        return $user->doctor;
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing([
            'doctor.department',
            'doctor.managedDepartment',
        ]);

        if (!$user->doctor) {
            return response()->json([
                'message' => 'Only authenticated doctor accounts can access this portal.',
            ], 403);
        }

        return response()->json([
            'user' => $user,
            'doctor' => $user->doctor,
            'roles' => method_exists($user, 'getRoleNames') ? $user->getRoleNames() : [],
            'permissions' => method_exists($user, 'getAllPermissions') ? $user->getAllPermissions()->pluck('name')->values() : [],
        ]);
    }

    public function courses(Request $request): JsonResponse
    {
        $doctor = $this->currentDoctor($request);

        $assignments = DoctorCourseAssignment::with([
            'course',
            'academicYear',
            'doctor.user',
            'doctor.department',
        ])
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('academic_year_id')
            ->orderBy('semester_number')
            ->get();

        return response()->json([
            'doctor' => $doctor->loadMissing(['user', 'department']),
            'courseAssignments' => $assignments,
        ]);
    }

    public function gradeObjections(Request $request): JsonResponse
    {
        $doctor = $this->currentDoctor($request);

        $assignments = DoctorCourseAssignment::where('doctor_id', $doctor->id)
            ->get(['course_id', 'academic_year_id']);

        if ($assignments->isEmpty()) {
            return response()->json([]);
        }

        $objections = GradeObjection::with([
            'student.user',
            'enrollment.course',
            'enrollment.academicYear',
            'enrollment.studyYear',
            'enrollment.grade',
        ])
            ->whereIn('status', ['sent_to_doctor', 'doctor_responded', 'approved', 'rejected'])
            ->whereHas('enrollment', function ($query) use ($assignments) {
                $query->where(function ($inner) use ($assignments) {
                    foreach ($assignments as $assignment) {
                        $inner->orWhere(function ($pair) use ($assignment) {
                            $pair->where('course_id', $assignment->course_id)
                                ->where('academic_year_id', $assignment->academic_year_id);
                        });
                    }
                });
            })
            ->latest()
            ->get()
            ->map(function (GradeObjection $objection) {
                return [
                    'id' => $objection->id,
                    'student_id' => $objection->student_id,
                    'student' => $objection->student,
                    'student_course_enrollment_id' => $objection->student_course_enrollment_id,
                    'enrollment' => $objection->enrollment,
                    'objection_text' => $objection->objection_text,
                    'objection_target' => $objection->objection_target,
                    'objection_target_label' => match ($objection->objection_target) {
                        'coursework' => 'Coursework Mark',
                        'practical' => 'Practical Mark',
                        'exam' => 'Exam Mark',
                        default => $objection->objection_target,
                    },
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
            })
            ->values();

        return response()->json($objections);
    }

    public function attendance(Request $request): JsonResponse
    {
        $doctor = $this->currentDoctor($request);

        $records = AttendanceRecord::with([
            'enrollment.student.user',
            'enrollment.course',
            'doctor.user',
        ])
            ->where('doctor_id', $doctor->id)
            ->latest('attendance_date')
            ->limit(100)
            ->get();

        return response()->json($records);
    }

    public function recordAttendance(Request $request, AttendanceService $attendanceService): JsonResponse
    {
        $doctor = $this->currentDoctor($request);

        $validated = $request->validate([
            'student_number' => ['required', 'string'],
            'course_id' => ['required', 'exists:courses,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'attendance_date' => ['nullable', 'date'],
        ]);

        $isAssigned = DoctorCourseAssignment::where('doctor_id', $doctor->id)
            ->where('course_id', $validated['course_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->exists();

        if (!$isAssigned) {
            return response()->json([
                'message' => 'You are not assigned to this course in the selected academic year.',
            ], 403);
        }

        try {
            $attendance = $attendanceService->recordAttendanceByStudentNumber(
                $validated['student_number'],
                (int) $validated['course_id'],
                (int) $validated['academic_year_id'],
                (int) $doctor->id,
                $validated['attendance_date'] ?? null
            );

            return response()->json([
                'message' => 'Attendance recorded successfully.',
                'data' => $attendance->load(['enrollment.student.user', 'enrollment.course', 'doctor.user']),
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to record attendance.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
