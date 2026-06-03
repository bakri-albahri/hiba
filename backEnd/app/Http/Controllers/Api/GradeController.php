<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Course;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentCourseGrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    public function indexByStudent(int $studentId): JsonResponse
    {
        $student = Student::with([
            'user',
            'courseEnrollments.course',
            'courseEnrollments.academicYear',
            'courseEnrollments.studyYear',
            'courseEnrollments.grade',
        ])->findOrFail($studentId);

        return response()->json([
            'student' => $student,
            'grades' => $student->courseEnrollments
                ->sortBy([
                    ['academic_year_id', 'asc'],
                    ['study_year_id', 'asc'],
                    ['semester_number', 'asc'],
                    ['course_id', 'asc'],
                ])
                ->map(function ($enrollment) {
                    return $this->formatEnrollmentGradeRow($enrollment);
                })->values(),
        ]);
    }

    public function indexByStudentAndAcademicYear(int $studentId, int $academicYearId): JsonResponse
    {
        $student = Student::with(['user', 'program', 'specialization'])->findOrFail($studentId);
        $academicYear = AcademicYear::findOrFail($academicYearId);

        $enrollments = StudentCourseEnrollment::with([
            'course',
            'academicYear',
            'studyYear',
            'grade',
        ])
            ->where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->orderBy('study_year_id')
            ->orderBy('semester_number')
            ->orderBy('course_id')
            ->get();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'academic_year' => [
                'id' => $academicYear->id,
                'name' => $academicYear->name,
            ],
            'grades_count' => $enrollments->count(),
            'grades' => $enrollments->map(function ($enrollment) {
                return $this->formatEnrollmentGradeRow($enrollment);
            })->values(),
        ]);
    }

    public function indexByCourseAndAcademicYear(int $courseId, int $academicYearId): JsonResponse
    {
        $course = Course::findOrFail($courseId);
        $academicYear = AcademicYear::findOrFail($academicYearId);

        $enrollments = StudentCourseEnrollment::with([
            'student.user',
            'studyYear',
            'grade',
        ])
            ->where('course_id', $courseId)
            ->where('academic_year_id', $academicYearId)
            ->orderBy('study_year_id')
            ->orderBy('semester_number')
            ->orderBy('student_id')
            ->get();

        return response()->json([
            'course' => [
                'id' => $course->id,
                'name' => $course->name,
                'code' => $course->code,
                'credit_hours' => $course->credit_hours,
            ],
            'academic_year' => [
                'id' => $academicYear->id,
                'name' => $academicYear->name,
            ],
            'students_count' => $enrollments->count(),
            'students' => $enrollments->map(function ($enrollment) {
                return [
                    'enrollment_id' => $enrollment->id,
                    'student_id' => $enrollment->student_id,
                    'student_number' => $enrollment->student?->student_number,
                    'student_name' => $enrollment->student?->user?->full_name,
                    'study_year_id' => $enrollment->study_year_id,
                    'study_year_number' => $enrollment->studyYear?->year_number,
                    'study_year_name' => $enrollment->studyYear?->name,
                    'semester_number' => $enrollment->semester_number,
                    'semester_label' => $this->formatSemesterLabel($enrollment->semester_number),
                    'is_carried' => $enrollment->is_carried,
                    'is_supplementary' => $enrollment->is_supplementary,
                    'enrollment_status' => $enrollment->status,
                    'grade' => $this->formatGradePayload($enrollment->grade),
                ];
            })->values(),
        ]);
    }

    public function studentsForCourseGrading(int $courseId, int $academicYearId): JsonResponse
    {
        $course = Course::findOrFail($courseId);
        $academicYear = AcademicYear::findOrFail($academicYearId);

        $enrollments = StudentCourseEnrollment::with([
            'student.user',
            'studyYear',
            'grade',
        ])
            ->where('course_id', $courseId)
            ->where('academic_year_id', $academicYearId)
            ->whereHas('student', function ($query) {
                $query->where('is_active_registration', true);
            })
            ->orderBy('study_year_id')
            ->orderBy('student_id')
            ->get();

        return response()->json([
            'message' => 'Students eligible for grade entry were retrieved successfully.',
            'course' => [
                'id' => $course->id,
                'name' => $course->name,
                'code' => $course->code,
            ],
            'academic_year' => [
                'id' => $academicYear->id,
                'name' => $academicYear->name,
            ],
            'students' => $enrollments->map(function ($enrollment) {
                return [
                    'enrollment_id' => $enrollment->id,
                    'student_id' => $enrollment->student_id,
                    'student_number' => $enrollment->student?->student_number,
                    'student_name' => $enrollment->student?->user?->full_name,
                    'study_year_id' => $enrollment->study_year_id,
                    'study_year_number' => $enrollment->studyYear?->year_number,
                    'study_year_name' => $enrollment->studyYear?->name,
                    'semester_number' => $enrollment->semester_number,
                    'semester_label' => $this->formatSemesterLabel($enrollment->semester_number),
                    'is_carried' => $enrollment->is_carried,
                    'is_supplementary' => $enrollment->is_supplementary,
                    'current_grade' => $this->formatGradePayload($enrollment->grade),
                ];
            })->values(),
        ]);
    }

    public function bulkStoreOrUpdate(Request $request, int $courseId, int $academicYearId): JsonResponse
    {
        Course::findOrFail($courseId);
        AcademicYear::findOrFail($academicYearId);

        $validated = $request->validate([
            'grades' => ['required', 'array', 'min:1'],
            'grades.*.enrollment_id' => ['required', 'integer', 'exists:student_course_enrollments,id'],
            'grades.*.coursework_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.practical_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.exam_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'grades.*.is_locked' => ['nullable', 'boolean'],
        ]);

        $enrollmentIds = collect($validated['grades'])
            ->pluck('enrollment_id')
            ->unique()
            ->values();

        $enrollments = StudentCourseEnrollment::with(['grade', 'student.user', 'course', 'academicYear'])
            ->whereIn('id', $enrollmentIds)
            ->get()
            ->keyBy('id');

        foreach ($validated['grades'] as $gradeRow) {
            $enrollment = $enrollments->get($gradeRow['enrollment_id']);

            if (!$enrollment) {
                return response()->json([
                    'message' => 'One or more selected enrollments were not found.',
                ], 422);
            }

            if ((int) $enrollment->course_id !== $courseId || (int) $enrollment->academic_year_id !== $academicYearId) {
                return response()->json([
                    'message' => 'One or more selected enrollments do not belong to the selected course and academic year.',
                    'invalid_enrollment_id' => $enrollment->id,
                ], 422);
            }

            if ($enrollment->grade && $enrollment->grade->is_locked) {
                return response()->json([
                    'message' => 'One or more grades are locked and cannot be modified.',
                    'locked_enrollment_id' => $enrollment->id,
                    'student_number' => $enrollment->student?->student_number,
                ], 422);
            }
        }

        $updatedGrades = DB::transaction(function () use ($validated, $enrollments) {
            $result = [];

            foreach ($validated['grades'] as $gradeRow) {
                $enrollment = $enrollments->get($gradeRow['enrollment_id']);
                $existingGrade = $enrollment->grade;

                $payload = [
                    'coursework_mark' => array_key_exists('coursework_mark', $gradeRow)
                        ? $gradeRow['coursework_mark']
                        : $existingGrade?->coursework_mark,
                    'practical_mark' => array_key_exists('practical_mark', $gradeRow)
                        ? $gradeRow['practical_mark']
                        : $existingGrade?->practical_mark,
                    'exam_mark' => array_key_exists('exam_mark', $gradeRow)
                        ? $gradeRow['exam_mark']
                        : $existingGrade?->exam_mark,
                    'is_locked' => array_key_exists('is_locked', $gradeRow)
                        ? $gradeRow['is_locked']
                        : ($existingGrade?->is_locked ?? false),
                    'last_updated_at' => now(),
                ];

                $grade = StudentCourseGrade::updateOrCreate(
                    [
                        'student_course_enrollment_id' => $enrollment->id,
                    ],
                    $payload
                );

                $result[] = [
                    'enrollment_id' => $enrollment->id,
                    'student_id' => $enrollment->student_id,
                    'student_number' => $enrollment->student?->student_number,
                    'student_name' => $enrollment->student?->user?->full_name,
                    'grade' => $this->formatGradePayload($grade->fresh()),
                ];
            }

            return $result;
        });

        return response()->json([
            'message' => 'Grades saved successfully for the selected course.',
            'updated_count' => count($updatedGrades),
            'data' => $updatedGrades,
        ]);
    }

    public function storeOrUpdate(Request $request, int $enrollmentId): JsonResponse
    {
        $enrollment = StudentCourseEnrollment::with(['course', 'grade'])
            ->findOrFail($enrollmentId);

        $validated = $request->validate([
            'coursework_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'practical_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'exam_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_locked' => ['nullable', 'boolean'],
        ]);

        if ($enrollment->grade && $enrollment->grade->is_locked) {
            return response()->json([
                'message' => 'This grade is locked and cannot be modified.',
            ], 422);
        }

        $existingGrade = $enrollment->grade;

        $payload = [
            'coursework_mark' => array_key_exists('coursework_mark', $validated)
                ? $validated['coursework_mark']
                : $existingGrade?->coursework_mark,
            'practical_mark' => array_key_exists('practical_mark', $validated)
                ? $validated['practical_mark']
                : $existingGrade?->practical_mark,
            'exam_mark' => array_key_exists('exam_mark', $validated)
                ? $validated['exam_mark']
                : $existingGrade?->exam_mark,
            'is_locked' => array_key_exists('is_locked', $validated)
                ? $validated['is_locked']
                : ($existingGrade?->is_locked ?? false),
            'last_updated_at' => now(),
        ];

        $grade = StudentCourseGrade::updateOrCreate(
            [
                'student_course_enrollment_id' => $enrollment->id,
            ],
            $payload
        );

        return response()->json([
            'message' => 'Grade saved successfully.',
            'data' => $this->formatGradePayload($grade->fresh()),
        ]);
    }

    public function quickStoreByCourseAndStudentNumber(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'student_number' => ['required', 'string', 'max:255'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'course_code' => ['nullable', 'string', 'max:255'],
            'course_name' => ['nullable', 'string', 'max:255'],
            'coursework_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'practical_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'exam_mark' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_locked' => ['nullable', 'boolean'],
        ]);

        if (
            empty($validated['course_id'])
            && empty($validated['course_code'])
            && empty($validated['course_name'])
        ) {
            return response()->json([
                'message' => 'You must provide course_id, course_code, or course_name.',
            ], 422);
        }

        $student = Student::with('user')
            ->where('student_number', $validated['student_number'])
            ->first();

        if (!$student) {
            return response()->json([
                'message' => 'No student was found with the provided student number.',
            ], 404);
        }

        $course = $this->resolveCourseFromQuickEntry($validated);

        if (!$course) {
            return response()->json([
                'message' => 'No course was found using the provided course identifier.',
            ], 404);
        }

        $enrollment = StudentCourseEnrollment::with(['grade', 'course', 'student.user', 'academicYear', 'studyYear'])
            ->where('student_id', $student->id)
            ->where('course_id', $course->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->orderByDesc('is_supplementary')
            ->orderByDesc('id')
            ->first();

        if (!$enrollment) {
            return response()->json([
                'message' => 'The selected student is not enrolled in this course for the selected academic year.',
            ], 422);
        }

        if ($enrollment->grade && $enrollment->grade->is_locked) {
            return response()->json([
                'message' => 'This grade is locked and cannot be modified.',
            ], 422);
        }

        $existingGrade = $enrollment->grade;

        $payload = [
            'coursework_mark' => array_key_exists('coursework_mark', $validated)
                ? $validated['coursework_mark']
                : $existingGrade?->coursework_mark,
            'practical_mark' => array_key_exists('practical_mark', $validated)
                ? $validated['practical_mark']
                : $existingGrade?->practical_mark,
            'exam_mark' => array_key_exists('exam_mark', $validated)
                ? $validated['exam_mark']
                : $existingGrade?->exam_mark,
            'is_locked' => array_key_exists('is_locked', $validated)
                ? $validated['is_locked']
                : ($existingGrade?->is_locked ?? false),
            'last_updated_at' => now(),
        ];

        $grade = StudentCourseGrade::updateOrCreate(
            [
                'student_course_enrollment_id' => $enrollment->id,
            ],
            $payload
        );

        return response()->json([
            'message' => 'Grade saved successfully using course identifier and student number.',
            'data' => [
                'enrollment_id' => $enrollment->id,
                'student_id' => $enrollment->student_id,
                'student_number' => $student->student_number,
                'student_name' => $student->user?->full_name,
                'course_id' => $course->id,
                'course_name' => $course->name,
                'course_code' => $course->code,
                'academic_year_id' => $enrollment->academic_year_id,
                'academic_year_name' => $enrollment->academicYear?->name,
                'study_year_id' => $enrollment->study_year_id,
                'study_year_number' => $enrollment->studyYear?->year_number,
                'study_year_name' => $enrollment->studyYear?->name,
                'semester_number' => $enrollment->semester_number,
                'semester_label' => $this->formatSemesterLabel($enrollment->semester_number),
                'is_supplementary' => $enrollment->is_supplementary,
                'grade' => $this->formatGradePayload($grade->fresh()),
            ],
        ]);
    }

    public function lock(Request $request, int $enrollmentId): JsonResponse
    {
        $enrollment = StudentCourseEnrollment::with('grade')->findOrFail($enrollmentId);

        if (!$enrollment->grade) {
            return response()->json([
                'message' => 'No grade found for this enrollment.',
            ], 422);
        }

        $enrollment->grade->update([
            'is_locked' => true,
        ]);

        return response()->json([
            'message' => 'Grade locked successfully.',
            'data' => $this->formatGradePayload($enrollment->grade->fresh()),
        ]);
    }

    private function resolveCourseFromQuickEntry(array $validated): ?Course
    {
        if (!empty($validated['course_id'])) {
            return Course::find($validated['course_id']);
        }

        if (!empty($validated['course_code'])) {
            return Course::where('code', $validated['course_code'])->first();
        }

        if (!empty($validated['course_name'])) {
            return Course::where('name', $validated['course_name'])->first();
        }

        return null;
    }

    private function formatEnrollmentGradeRow(StudentCourseEnrollment $enrollment): array
    {
        return [
            'enrollment_id' => $enrollment->id,
            'course_id' => $enrollment->course_id,
            'course_name' => $enrollment->course?->name,
            'course_code' => $enrollment->course?->code,
            'course_credit_hours' => $enrollment->course?->credit_hours,
            'academic_year_id' => $enrollment->academic_year_id,
            'academic_year' => $enrollment->academicYear?->name,
            'academic_year_name' => $enrollment->academicYear?->name,
            'study_year_id' => $enrollment->study_year_id,
            'study_year' => $enrollment->studyYear?->name,
            'study_year_name' => $enrollment->studyYear?->name,
            'study_year_number' => $enrollment->studyYear?->year_number,
            'semester_number' => $enrollment->semester_number,
            'semester_label' => $this->formatSemesterLabel($enrollment->semester_number),
            'is_carried' => $enrollment->is_carried,
            'is_supplementary' => $enrollment->is_supplementary,
            'enrollment_status' => $enrollment->status,
            'course' => [
                'id' => $enrollment->course?->id,
                'name' => $enrollment->course?->name,
                'code' => $enrollment->course?->code,
                'credit_hours' => $enrollment->course?->credit_hours,
                'max_mark' => $enrollment->course?->max_mark,
                'pass_mark' => $enrollment->course?->pass_mark,
            ],
            'academic_year_meta' => [
                'id' => $enrollment->academicYear?->id,
                'name' => $enrollment->academicYear?->name,
            ],
            'study_year_meta' => [
                'id' => $enrollment->studyYear?->id,
                'number' => $enrollment->studyYear?->year_number,
                'name' => $enrollment->studyYear?->name,
            ],
            'grade' => $this->formatGradePayload($enrollment->grade),
        ];
    }

    private function formatSemesterLabel(?int $semesterNumber): ?string
    {
        if (!$semesterNumber) {
            return null;
        }

        return 'Semester ' . $semesterNumber;
    }

    private function formatGradePayload(?StudentCourseGrade $grade): array
    {
        return [
            'id' => $grade?->id,
            'coursework_mark' => $grade?->coursework_mark ?? 0,
            'practical_mark' => $grade?->practical_mark ?? 0,
            'exam_mark' => $grade?->exam_mark ?? 0,
            'final_mark' => $grade?->final_mark ?? 0,
            'weights' => [
                'coursework' => StudentCourseGrade::COURSEWORK_WEIGHT,
                'practical' => StudentCourseGrade::PRACTICAL_WEIGHT,
                'exam' => StudentCourseGrade::EXAM_WEIGHT,
            ],
            'result_status' => $grade?->result_status ?? 'pending',
            'is_locked' => $grade?->is_locked ?? false,
            'last_updated_at' => $grade?->last_updated_at,
        ];
    }
}