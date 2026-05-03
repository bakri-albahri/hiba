<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\GradeObjection;
use App\Models\Student;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function studentReport(int $studentId): JsonResponse
    {
        $student = Student::with([
            'user',
            'program',
            'specialization',
            'academicRecords.academicYear',
            'academicRecords.studyYear',
            'courseEnrollments.course',
            'courseEnrollments.academicYear',
            'courseEnrollments.studyYear',
            'courseEnrollments.grade',
            'courseEnrollments.attendanceRecords.doctor.user',
            'statusHistories.changedBy',
        ])->findOrFail($studentId);

        $gradeObjections = GradeObjection::with([
            'enrollment.course',
            'enrollment.academicYear',
            'enrollment.studyYear',
            'enrollment.grade',
        ])
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        $report = [
            'student' => $student,
            'statistics' => [
                'total_enrollments' => $student->courseEnrollments->count(),
                'graded_courses' => $student->courseEnrollments->filter(fn ($e) => $e->grade !== null)->count(),
                'passed_courses' => $student->courseEnrollments->filter(function ($e) {
                    return $e->grade && in_array($e->grade->result_status, ['passed', 'conditionally_passed']);
                })->count(),
                'carried_courses' => $student->courseEnrollments->filter(function ($e) {
                    return $e->grade && $e->grade->result_status === 'carried';
                })->count(),
                'attendance_records' => $student->courseEnrollments->sum(function ($e) {
                    return $e->attendanceRecords->count();
                }),
                'grade_objections_count' => $gradeObjections->count(),
                'pending_grade_objections_count' => $gradeObjections->whereIn('status', [
                    'submitted',
                    'under_review',
                    'sent_to_doctor',
                    'doctor_responded',
                ])->count(),
            ],
            'grade_objections' => $gradeObjections->map(function ($objection) {
                return [
                    'id' => $objection->id,
                    'student_course_enrollment_id' => $objection->student_course_enrollment_id,
                    'course_id' => $objection->enrollment?->course_id,
                    'course_name' => $objection->enrollment?->course?->name,
                    'course_code' => $objection->enrollment?->course?->code,
                    'academic_year' => $objection->enrollment?->academicYear?->name,
                    'study_year' => $objection->enrollment?->studyYear?->name,
                    'semester_number' => $objection->enrollment?->semester_number,
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
                    'current_grade' => [
                        'coursework_mark' => $objection->enrollment?->grade?->coursework_mark,
                        'practical_mark' => $objection->enrollment?->grade?->practical_mark,
                        'exam_mark' => $objection->enrollment?->grade?->exam_mark,
                        'final_mark' => $objection->enrollment?->grade?->final_mark,
                        'result_status' => $objection->enrollment?->grade?->result_status,
                    ],
                    'submitted_at' => $objection->submitted_at,
                    'created_at' => $objection->created_at,
                    'updated_at' => $objection->updated_at,
                ];
            })->values(),
        ];

        return response()->json($report);
    }

    public function departmentReport(int $departmentId): JsonResponse
    {
        $department = Department::with([
            'managerUser',
            'managerEmployee.user',
            'managerDoctor.user',
            'employees.user',
            'doctors.user',
            'courses',
        ])->findOrFail($departmentId);

        $report = [
            'department' => [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'description' => $department->description,
                'is_active' => $department->is_active,
                'manager_user' => $department->managerUser,
                'manager_employee' => $department->managerEmployee,
                'manager_doctor' => $department->managerDoctor,
                'employees' => $department->employees,
                'doctors' => $department->doctors,
                'courses' => $department->courses,
            ],
            'statistics' => [
                'employees_count' => $department->employees->count(),
                'active_employees_count' => $department->employees->where('is_active', true)->count(),
                'doctors_count' => $department->doctors->count(),
                'active_doctors_count' => $department->doctors->where('is_active', true)->count(),
                'courses_count' => $department->courses->count(),
                'active_courses_count' => $department->courses->where('is_active', true)->count(),
                'has_manager' => $department->managerUser !== null,
                'manager_type' => $department->managerEmployee
                    ? 'employee'
                    : ($department->managerDoctor ? 'doctor' : null),
            ],
        ];

        return response()->json($report);
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