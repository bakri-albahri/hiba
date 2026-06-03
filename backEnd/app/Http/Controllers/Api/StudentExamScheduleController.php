<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentExamScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $student = Student::with(['user', 'program', 'specialization'])
            ->where('user_id', $user->id)
            ->first();

        if (!$student) {
            return response()->json([
                'message' => 'This account is not linked to a student profile.',
            ], 404);
        }

        $academicYearId = $request->query('academic_year_id');

        if (!$academicYearId) {
            $academicYearId = DB::table('academic_years')
                ->where('is_current', true)
                ->orderByDesc('id')
                ->value('id');
        }

        $academicYear = $academicYearId
            ? DB::table('academic_years')->where('id', $academicYearId)->first()
            : null;

        $enrollmentsQuery = DB::table('student_course_enrollments')
            ->where('student_id', $student->id);

        if ($academicYearId) {
            $enrollmentsQuery->where('academic_year_id', $academicYearId);
        }

        $enrollments = $enrollmentsQuery->get();
        $courseIds = $enrollments->pluck('course_id')->filter()->unique()->values();

        $regularExams = collect();
        if ($courseIds->isNotEmpty()) {
            $regularExams = DB::table('exam_schedules as es')
                ->join('courses as c', 'c.id', '=', 'es.course_id')
                ->leftJoin('academic_years as ay', 'ay.id', '=', 'es.academic_year_id')
                ->whereIn('es.course_id', $courseIds)
                ->when($academicYearId, function ($query) use ($academicYearId) {
                    $query->where('es.academic_year_id', $academicYearId);
                })
                ->select([
                    'es.id',
                    'es.course_id',
                    'es.academic_year_id',
                    'es.semester_number',
                    'es.exam_date',
                    'es.exam_room',
                    'es.created_at',
                    'es.updated_at',
                    'c.code as course_code',
                    'c.name as course_name',
                    'c.credit_hours as course_credit_hours',
                    'ay.name as academic_year_name',
                ])
                ->orderBy('es.exam_date')
                ->get()
                ->map(function ($exam) {
                    return $this->normalizeExamRow($exam, 'regular');
                });
        }

        $supplementaryCourseIds = DB::table('student_course_enrollments')
            ->where('student_id', $student->id)
            ->where('is_supplementary', true)
            ->when($academicYearId, function ($query) use ($academicYearId) {
                $query->where('academic_year_id', $academicYearId);
            })
            ->pluck('course_id');

        $approvedRequestCourseIds = DB::table('supplementary_exam_requests as ser')
            ->join('student_course_enrollments as sce', 'sce.id', '=', 'ser.student_course_enrollment_id')
            ->where('ser.student_id', $student->id)
            ->whereIn('ser.status', ['approved', 'completed'])
            ->when($academicYearId, function ($query) use ($academicYearId) {
                $query->where('ser.academic_year_id', $academicYearId);
            })
            ->pluck('sce.course_id');

        $supplementaryCourseIds = $supplementaryCourseIds
            ->merge($approvedRequestCourseIds)
            ->filter()
            ->unique()
            ->values();

        $supplementaryExams = collect();
        if ($supplementaryCourseIds->isNotEmpty()) {
            $supplementaryExams = DB::table('supplementary_exam_schedules as ses')
                ->join('courses as c', 'c.id', '=', 'ses.course_id')
                ->leftJoin('academic_years as ay', 'ay.id', '=', 'ses.academic_year_id')
                ->whereIn('ses.course_id', $supplementaryCourseIds)
                ->when($academicYearId, function ($query) use ($academicYearId) {
                    $query->where('ses.academic_year_id', $academicYearId);
                })
                ->select([
                    'ses.id',
                    'ses.course_id',
                    'ses.academic_year_id',
                    DB::raw('NULL as semester_number'),
                    'ses.exam_date',
                    'ses.exam_room',
                    'ses.created_at',
                    'ses.updated_at',
                    'c.code as course_code',
                    'c.name as course_name',
                    'c.credit_hours as course_credit_hours',
                    'ay.name as academic_year_name',
                ])
                ->orderBy('ses.exam_date')
                ->get()
                ->map(function ($exam) {
                    return $this->normalizeExamRow($exam, 'supplementary');
                });
        }

        $all = $regularExams
            ->merge($supplementaryExams)
            ->sortBy('exam_date')
            ->values();

        $now = now();

        return response()->json([
            'student_id' => $student->id,
            'student_number' => $student->student_number,
            'academic_year' => $academicYear,
            'regular_exams' => $regularExams->values(),
            'supplementary_exams' => $supplementaryExams->values(),
            'upcoming' => $all->filter(function ($exam) use ($now) {
                return !empty($exam['exam_date']) && \Carbon\Carbon::parse($exam['exam_date'])->greaterThanOrEqualTo($now);
            })->values(),
            'past' => $all->filter(function ($exam) use ($now) {
                return !empty($exam['exam_date']) && \Carbon\Carbon::parse($exam['exam_date'])->lessThan($now);
            })->values(),
        ]);
    }

    public function examCard(Request $request): JsonResponse
    {
        $student = Student::with(['user', 'program', 'specialization'])
            ->where('user_id', $request->user()?->id)
            ->first();

        if (!$student) {
            return response()->json([
                'message' => 'This account is not linked to a student profile.',
            ], 404);
        }

        $academicYearId = $request->query('academic_year_id');

        if (!$academicYearId) {
            $academicYearId = DB::table('academic_years')
                ->where('is_current', true)
                ->orderByDesc('id')
                ->value('id');
        }

        $academicYear = $academicYearId
            ? DB::table('academic_years')->where('id', $academicYearId)->first()
            : null;

        $currentRecord = DB::table('student_academic_records')
            ->leftJoin('study_years', 'study_years.id', '=', 'student_academic_records.study_year_id')
            ->where('student_academic_records.student_id', $student->id)
            ->when($academicYearId, function ($query) use ($academicYearId) {
                $query->where('student_academic_records.academic_year_id', $academicYearId);
            })
            ->orderByDesc('student_academic_records.academic_year_id')
            ->orderByDesc('student_academic_records.id')
            ->select([
                'student_academic_records.*',
                'study_years.name as study_year_name',
            ])
            ->first();

        $baseEligibility = $this->baseExamEligibility($student, $currentRecord);

        $regularRows = $this->regularExamCardRows($student, $academicYearId, $baseEligibility);
        $supplementaryRows = $this->supplementaryExamCardRows($student, $academicYearId, $baseEligibility);

        $examCardRows = $regularRows
            ->merge($supplementaryRows)
            ->sortBy('exam_date')
            ->values();

        $eligibleCount = $examCardRows->filter(fn ($row) => (bool) $row['eligible'])->count();
        $blockedCount = $examCardRows->count() - $eligibleCount;

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'email' => $student->user?->email,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
                'is_active_registration' => (bool) $student->is_active_registration,
                'is_exhausted' => (bool) $student->is_exhausted,
            ],
            'academic_year' => $academicYear,
            'academic_record' => $currentRecord,
            'eligibility_summary' => [
                'total_exams' => $examCardRows->count(),
                'eligible_count' => $eligibleCount,
                'blocked_count' => $blockedCount,
                'tuition_paid' => (bool) ($currentRecord?->tuition_paid ?? false),
                'registration_status' => $currentRecord?->registration_status,
                'academic_result' => $currentRecord?->academic_result,
                'active_registration' => (bool) $student->is_active_registration,
                'exhausted' => (bool) $student->is_exhausted,
            ],
            'exam_card' => $examCardRows,
            'exams' => $examCardRows,
        ]);
    }

    private function regularExamCardRows(Student $student, ?int $academicYearId, array $baseEligibility)
    {
        return DB::table('student_course_enrollments as sce')
            ->join('courses as c', 'c.id', '=', 'sce.course_id')
            ->join('exam_schedules as es', function ($join) {
                $join->on('es.course_id', '=', 'sce.course_id')
                    ->on('es.academic_year_id', '=', 'sce.academic_year_id')
                    ->on('es.semester_number', '=', 'sce.semester_number');
            })
            ->leftJoin('academic_years as ay', 'ay.id', '=', 'sce.academic_year_id')
            ->leftJoin('study_years as sy', 'sy.id', '=', 'sce.study_year_id')
            ->where('sce.student_id', $student->id)
            ->where('sce.is_supplementary', false)
            ->when($academicYearId, function ($query) use ($academicYearId) {
                $query->where('sce.academic_year_id', $academicYearId);
            })
            ->select([
                'sce.id as enrollment_id',
                'sce.status as enrollment_status',
                'sce.academic_year_id',
                'sce.study_year_id',
                'sce.semester_number',
                'sce.course_id',
                'c.code as course_code',
                'c.name as course_name',
                'c.credit_hours as course_credit_hours',
                'es.id as exam_schedule_id',
                'es.exam_date',
                'es.exam_room',
                'ay.name as academic_year_name',
                'sy.name as study_year_name',
            ])
            ->orderBy('es.exam_date')
            ->get()
            ->map(function ($row) use ($baseEligibility) {
                return $this->buildExamCardRow($row, 'regular', $baseEligibility);
            });
    }

    private function supplementaryExamCardRows(Student $student, ?int $academicYearId, array $baseEligibility)
    {
        return DB::table('supplementary_exam_requests as ser')
            ->join('student_course_enrollments as sce', 'sce.id', '=', 'ser.student_course_enrollment_id')
            ->join('courses as c', 'c.id', '=', 'sce.course_id')
            ->join('supplementary_exam_schedules as ses', function ($join) {
                $join->on('ses.course_id', '=', 'sce.course_id')
                    ->on('ses.academic_year_id', '=', 'ser.academic_year_id');
            })
            ->leftJoin('academic_years as ay', 'ay.id', '=', 'ser.academic_year_id')
            ->leftJoin('study_years as sy', 'sy.id', '=', 'sce.study_year_id')
            ->where('ser.student_id', $student->id)
            ->whereIn('ser.status', ['approved', 'completed'])
            ->when($academicYearId, function ($query) use ($academicYearId) {
                $query->where('ser.academic_year_id', $academicYearId);
            })
            ->select([
                'sce.id as enrollment_id',
                'sce.status as enrollment_status',
                'ser.status as supplementary_request_status',
                'ser.id as supplementary_request_id',
                'ser.academic_year_id',
                'sce.study_year_id',
                DB::raw('NULL as semester_number'),
                'sce.course_id',
                'c.code as course_code',
                'c.name as course_name',
                'c.credit_hours as course_credit_hours',
                'ses.id as exam_schedule_id',
                'ses.exam_date',
                'ses.exam_room',
                'ay.name as academic_year_name',
                'sy.name as study_year_name',
            ])
            ->orderBy('ses.exam_date')
            ->get()
            ->map(function ($row) use ($baseEligibility) {
                return $this->buildExamCardRow($row, 'supplementary', $baseEligibility);
            });
    }

    private function buildExamCardRow(object $row, string $type, array $baseEligibility): array
    {
        $attendanceRequired = $type === 'regular'
            ? DB::table('course_attendance_requirements')
                ->where('course_id', $row->course_id)
                ->where('academic_year_id', $row->academic_year_id)
                ->where('semester_number', $row->semester_number)
                ->value('required_attendance_count')
            : null;

        $attendanceCount = DB::table('attendance_records')
            ->where('student_course_enrollment_id', $row->enrollment_id)
            ->count();

        $attendanceEligible = $attendanceRequired === null || $attendanceCount >= (int) $attendanceRequired;
        $reasons = $baseEligibility['reasons'];

        if ($type === 'regular' && !$attendanceEligible) {
            $reasons[] = 'Attendance requirement is not completed.';
        }

        if ($type === 'supplementary' && !in_array($row->supplementary_request_status ?? null, ['approved', 'completed'], true)) {
            $reasons[] = 'Supplementary exam request is not approved.';
        }

        $eligible = empty($reasons);

        return [
            'id' => $type . '-' . $row->exam_schedule_id . '-' . $row->enrollment_id,
            'exam_schedule_id' => $row->exam_schedule_id,
            'exam_type' => $type,
            'eligible' => $eligible,
            'eligibility_status' => $eligible ? 'eligible' : 'blocked',
            'eligibility_label' => $eligible ? 'Allowed' : 'Blocked',
            'eligibility_reasons' => $reasons,
            'student_course_enrollment_id' => $row->enrollment_id,
            'enrollment_id' => $row->enrollment_id,
            'enrollment_status' => $row->enrollment_status,
            'course_id' => $row->course_id,
            'course_code' => $row->course_code,
            'course_name' => $row->course_name,
            'course_credit_hours' => $row->course_credit_hours,
            'academic_year_id' => $row->academic_year_id,
            'academic_year' => $row->academic_year_name,
            'study_year_id' => $row->study_year_id,
            'study_year' => $row->study_year_name,
            'semester_number' => $row->semester_number,
            'exam_date' => $row->exam_date,
            'exam_room' => $row->exam_room,
            'attendance_count' => $attendanceCount,
            'attendance_required' => $attendanceRequired,
            'attendance_eligible' => $attendanceEligible,
            'supplementary_request_status' => $row->supplementary_request_status ?? null,
        ];
    }

    private function baseExamEligibility(Student $student, ?object $currentRecord): array
    {
        $reasons = [];

        if (!$student->is_active_registration) {
            $reasons[] = 'Student registration is not active.';
        }

        if ($student->is_exhausted) {
            $reasons[] = 'Student academic status is exhausted.';
        }

        if (!$currentRecord) {
            $reasons[] = 'No academic record was found for this academic year.';
        } else {
            if ($currentRecord->registration_status !== 'registered') {
                $reasons[] = 'Registration status is not registered.';
            }

            if (!$currentRecord->tuition_paid) {
                $reasons[] = 'Tuition payment is not cleared.';
            }
        }

        return [
            'eligible' => empty($reasons),
            'reasons' => $reasons,
        ];
    }

    private function normalizeExamRow(object $exam, string $type): array
    {
        return [
            'id' => $exam->id,
            'exam_type' => $type,
            'course_id' => $exam->course_id,
            'course_code' => $exam->course_code,
            'course_name' => $exam->course_name,
            'semester_number' => $exam->semester_number,
            'academic_year_id' => $exam->academic_year_id,
            'academic_year' => $exam->academic_year_name,
            'exam_date' => $exam->exam_date,
            'exam_room' => $exam->exam_room,
            'course' => [
                'id' => $exam->course_id,
                'code' => $exam->course_code,
                'name' => $exam->course_name,
                'credit_hours' => $exam->course_credit_hours,
            ],
            'created_at' => $exam->created_at,
            'updated_at' => $exam->updated_at,
        ];
    }
}
