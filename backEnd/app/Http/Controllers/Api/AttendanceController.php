<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class AttendanceController extends Controller
{
    public function recordByStudentNumber(
        Request $request,
        AttendanceService $attendanceService
    ): JsonResponse {
        $validated = $request->validate([
            'student_number' => ['required', 'string'],
            'course_id' => ['required', 'exists:courses,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'doctor_id' => ['required', 'exists:doctors,id'],
            'attendance_date' => ['nullable', 'date'],
        ]);

        try {
            $attendance = $attendanceService->recordAttendanceByStudentNumber(
                $validated['student_number'],
                (int) $validated['course_id'],
                (int) $validated['academic_year_id'],
                (int) $validated['doctor_id'],
                $validated['attendance_date'] ?? null
            );

            return response()->json([
                'message' => 'Attendance recorded successfully.',
                'data' => $attendance->load(['enrollment.course', 'doctor.user']),
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'Failed to record attendance.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function listByStudent(int $studentId): JsonResponse
    {
        $student = Student::with([
            'user',
            'courseEnrollments.course',
            'courseEnrollments.attendanceRecords.doctor.user',
        ])->findOrFail($studentId);

        $attendance = $student->courseEnrollments->map(function ($enrollment) {
            return [
                'enrollment_id' => $enrollment->id,
                'course_id' => $enrollment->course_id,
                'course_name' => $enrollment->course?->name,
                'attendance_count' => $enrollment->attendanceRecords->count(),
                'records' => $enrollment->attendanceRecords->map(function ($record) {
                    return [
                        'id' => $record->id,
                        'attendance_date' => $record->attendance_date,
                        'recorded_at' => $record->recorded_at,
                        'doctor' => $record->doctor?->user?->full_name,
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'student' => $student->only(['id', 'student_number']),
            'attendance' => $attendance,
        ]);
    }
}
