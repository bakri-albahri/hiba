<?php

namespace App\Services;

use App\Models\AttendanceRecord;
use App\Models\CourseAttendanceRequirement;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use Carbon\Carbon;
use Exception;

class AttendanceService
{
    public function recordAttendanceByStudentNumber(
        string $studentNumber,
        int $courseId,
        int $academicYearId,
        int $doctorId,
        ?string $attendanceDate = null
    ): AttendanceRecord {
        $student = Student::where('student_number', $studentNumber)->first();

        if (!$student) {
            throw new Exception('Student not found.');
        }

        if (!$student->is_active_registration || $student->is_exhausted) {
            throw new Exception('Student registration is not active.');
        }

        $enrollment = StudentCourseEnrollment::where('student_id', $student->id)
            ->where('course_id', $courseId)
            ->where('academic_year_id', $academicYearId)
            ->first();

        if (!$enrollment) {
            throw new Exception('Student is not enrolled in this course.');
        }

        $date = $attendanceDate
            ? Carbon::parse($attendanceDate)->toDateString()
            : now()->toDateString();

        $existing = AttendanceRecord::where('student_course_enrollment_id', $enrollment->id)
            ->whereDate('attendance_date', $date)
            ->first();

        if ($existing) {
            throw new Exception('Attendance already recorded for this date.');
        }

        $requirement = CourseAttendanceRequirement::where('course_id', $courseId)
            ->where('academic_year_id', $academicYearId)
            ->where('semester_number', $enrollment->semester_number)
            ->first();

        if ($requirement) {
            $count = $enrollment->attendanceRecords()->count();

            if ($count >= $requirement->required_attendance_count) {
                throw new Exception('Attendance limit reached.');
            }
        }

        return AttendanceRecord::create([
            'student_course_enrollment_id' => $enrollment->id,
            'doctor_id' => $doctorId,
            'attendance_date' => $date,
            'recorded_at' => now(),
        ]);
    }
}