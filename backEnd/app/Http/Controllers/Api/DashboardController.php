<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Employee;
use App\Models\GradeObjection;
use App\Models\Student;
use App\Models\StudentAcademicRecord;
use App\Models\StudentCourseEnrollment;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function overview(): JsonResponse
    {
        $currentAcademicYear = AcademicYear::where('is_current', true)->first();

        $overview = [
            'current_academic_year' => $currentAcademicYear,
            'totals' => [
                'students' => Student::count(),
                'active_students' => Student::where('is_active_registration', true)->count(),
                'stopped_students' => Student::where('is_active_registration', false)->count(),
                'exhausted_students' => Student::where('is_exhausted', true)->count(),
                'doctors' => Doctor::count(),
                'active_doctors' => Doctor::where('is_active', true)->count(),
                'employees' => Employee::count(),
                'active_employees' => Employee::where('is_active', true)->count(),
                'departments' => Department::count(),
                'active_departments' => Department::where('is_active', true)->count(),
                'courses' => Course::count(),
                'active_courses' => Course::where('is_active', true)->count(),
            ],
            'academic' => [
                'student_academic_records' => StudentAcademicRecord::count(),
                'course_enrollments' => StudentCourseEnrollment::count(),
                'grade_objections' => GradeObjection::count(),
                'pending_grade_objections' => GradeObjection::whereIn('status', [
                    'submitted',
                    'under_review',
                    'sent_to_doctor',
                    'doctor_responded',
                ])->count(),
            ],
        ];

        return response()->json($overview);
    }

    public function academicSummary(): JsonResponse
    {
        $currentAcademicYear = AcademicYear::where('is_current', true)->first();

        $query = StudentAcademicRecord::query();

        if ($currentAcademicYear) {
            $query->where('academic_year_id', $currentAcademicYear->id);
        }

        $currentAcademicYearId = $currentAcademicYear?->id;

        $carriedCoursesQuery = StudentCourseEnrollment::query()
            ->where('is_carried', true);

        if ($currentAcademicYearId) {
            $carriedCoursesQuery->where('academic_year_id', $currentAcademicYearId);
        }

        $summary = [
            'current_academic_year' => $currentAcademicYear,
            'records_count' => (clone $query)->count(),
            'results' => [
                'in_progress' => (clone $query)->where('academic_result', 'in_progress')->count(),
                'passed' => (clone $query)->where('academic_result', 'passed')->count(),
                'promoted' => (clone $query)->where('academic_result', 'promoted')->count(),
                'failed' => (clone $query)->where('academic_result', 'failed')->count(),
                'exhausted' => (clone $query)->where('academic_result', 'exhausted')->count(),
            ],
            'registration_status' => [
                'pending' => (clone $query)->where('registration_status', 'pending')->count(),
                'registered' => (clone $query)->where('registration_status', 'registered')->count(),
                'not_registered' => (clone $query)->where('registration_status', 'not_registered')->count(),
                'stopped' => (clone $query)->where('registration_status', 'stopped')->count(),
            ],
            'carried_courses' => [
                'count' => $carriedCoursesQuery->count(),
            ],
        ];

        return response()->json($summary);
    }

    public function userSummary(): JsonResponse
    {
        return response()->json([
            'students' => [
                'total' => Student::count(),
                'active_registration' => Student::where('is_active_registration', true)->count(),
                'stopped_registration' => Student::where('is_active_registration', false)->count(),
                'exhausted' => Student::where('is_exhausted', true)->count(),
            ],
            'employees' => [
                'total' => Employee::count(),
                'active' => Employee::where('is_active', true)->count(),
                'inactive' => Employee::where('is_active', false)->count(),
            ],
            'doctors' => [
                'total' => Doctor::count(),
                'active' => Doctor::where('is_active', true)->count(),
                'inactive' => Doctor::where('is_active', false)->count(),
            ],
            'departments' => [
                'total' => Department::count(),
                'active' => Department::where('is_active', true)->count(),
                'inactive' => Department::where('is_active', false)->count(),
            ],
        ]);
    }

    public function financialSummary(): JsonResponse
    {
        $currentAcademicYear = AcademicYear::where('is_current', true)->first();

        $query = StudentAcademicRecord::query();

        if ($currentAcademicYear) {
            $query->where('academic_year_id', $currentAcademicYear->id);
        }

        return response()->json([
            'current_academic_year' => $currentAcademicYear,
            'records_count' => (clone $query)->count(),
            'tuition' => [
                'paid' => (clone $query)->where('tuition_paid', true)->count(),
                'unpaid' => (clone $query)->where('tuition_paid', false)->count(),
            ],
            'registration_status' => [
                'registered' => (clone $query)->where('registration_status', 'registered')->count(),
                'not_registered' => (clone $query)->where('registration_status', 'not_registered')->count(),
                'stopped' => (clone $query)->where('registration_status', 'stopped')->count(),
                'pending' => (clone $query)->where('registration_status', 'pending')->count(),
            ],
        ]);
    }
}