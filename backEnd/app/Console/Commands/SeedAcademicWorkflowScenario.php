<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SeedAcademicWorkflowScenario extends Command
{
    protected $signature = 'workflow:seed-academic-scenario {--fresh : Delete only the WF2030/WF-TST test scenario before seeding}';

    protected $description = 'Seed a full academic workflow scenario for promotion, carried courses, supplementary exams, and year closing tests.';

    private string $yearName = 'WF2030-2031';
    private string $nextYearName = 'WF2031-2032';
    private string $coursePrefix = 'WF-TST';
    private string $studentPrefix = 'WF2030';

    public function handle(): int
    {
        $this->info('Building academic workflow test scenario...');

        $requiredTables = [
            'users',
            'students',
            'programs',
            'study_years',
            'academic_years',
            'departments',
            'courses',
            'study_plans',
            'study_plan_courses',
            'student_academic_records',
            'student_course_enrollments',
            'student_course_grades',
        ];

        foreach ($requiredTables as $table) {
            if (!Schema::hasTable($table)) {
                $this->error("Missing table: {$table}");
                return self::FAILURE;
            }
        }

        if ($this->option('fresh')) {
            $this->deleteScenarioData();
        }

        $programId = $this->firstId('programs') ?: $this->insertAndGetId('programs', [
            'name' => 'WF Test Bachelor Program',
            'total_years' => 4,
            'level' => 'bachelor',
        ]);

        $studyYear1Id = $this->firstOrCreateStudyYear($programId, 1, 'WF First Year');
        $studyYear2Id = $this->firstOrCreateStudyYear($programId, 2, 'WF Second Year');

        $academicYearId = $this->firstOrCreateAcademicYear($this->yearName, true, false, '2030-09-01', '2031-06-30');
        $nextAcademicYearId = $this->firstOrCreateAcademicYear($this->nextYearName, false, false, '2031-09-01', '2032-06-30');

        $departmentId = $this->firstOrCreateDepartment();
        $courses = $this->createCourses($departmentId);
        $this->createStudyPlan($programId, $studyYear1Id, $courses);

        $students = [
            [
                'number' => $this->studentPrefix . '01',
                'name' => 'WF Passed Student',
                'email' => 'wf.passed.student@test.local',
                'marks' => [82, 78, 76, 88, 74, 91, 69, 80],
                'note' => 'Expected: passed / promoted',
            ],
            [
                'number' => $this->studentPrefix . '02',
                'name' => 'WF Carried Student',
                'email' => 'wf.carried.student@test.local',
                'marks' => [72, 63, 58, 55, 79, 61, 82, 67],
                'note' => 'Expected: promoted with carried courses',
            ],
            [
                'number' => $this->studentPrefix . '03',
                'name' => 'WF Failed Student',
                'email' => 'wf.failed.student@test.local',
                'marks' => [45, 49, 51, 52, 57, 40, 61, 48],
                'note' => 'Expected: failed/repeated year',
            ],
            [
                'number' => $this->studentPrefix . '04',
                'name' => 'WF Supplementary Student',
                'email' => 'wf.supplementary.student@test.local',
                'marks' => [78, 80, 59, 76, 82, 74, 88, 69],
                'note' => 'Expected: eligible for supplementary exam on one course',
            ],
        ];

        foreach ($students as $studentData) {
            $studentId = $this->createStudent($studentData, $programId);

            $this->insertAndGetId('student_academic_records', [
                'student_id' => $studentId,
                'academic_year_id' => $academicYearId,
                'study_year_id' => $studyYear1Id,
                'registration_status' => 'registered',
                'academic_result' => 'in_progress',
                'tuition_paid' => true,
                'payment_receipt_number' => 'WF-RCPT-' . $studentData['number'],
                'payment_receipt_date' => '2030-09-05',
                'notes' => $studentData['note'],
            ]);

            foreach ($courses as $index => $courseId) {
                $enrollmentId = $this->insertAndGetId('student_course_enrollments', [
                    'student_id' => $studentId,
                    'course_id' => $courseId,
                    'academic_year_id' => $academicYearId,
                    'study_year_id' => $studyYear1Id,
                    'semester_number' => $index < 4 ? 1 : 2,
                    'is_carried' => false,
                    'status' => 'enrolled',
                ]);

                $final = (int) $studentData['marks'][$index];
                $coursework = min(20, max(0, (int) round($final * 0.20)));
                $practical = min(20, max(0, (int) round($final * 0.20)));
                $exam = min(60, max(0, $final - $coursework - $practical));

                $this->upsertGrade($enrollmentId, [
                    'coursework_mark' => $coursework,
                    'practical_mark' => $practical,
                    'exam_mark' => $exam,
                    'final_mark' => $final,
                    'result_status' => $final >= 60 ? 'passed' : 'failed',
                    'is_locked' => true,
                ]);
            }
        }

        $suppStudent = DB::table('students')->where('student_number', $this->studentPrefix . '04')->first();
        if ($suppStudent && Schema::hasTable('supplementary_requests')) {
            $failedEnrollment = DB::table('student_course_enrollments')
                ->join('student_course_grades', function ($join) {
                    if (Schema::hasColumn('student_course_grades', 'student_course_enrollment_id')) {
                        $join->on('student_course_grades.student_course_enrollment_id', '=', 'student_course_enrollments.id');
                    } else {
                        $join->on('student_course_grades.enrollment_id', '=', 'student_course_enrollments.id');
                    }
                })
                ->where('student_course_enrollments.student_id', $suppStudent->id)
                ->where('student_course_grades.final_mark', '<', 60)
                ->select('student_course_enrollments.id')
                ->first();

            if ($failedEnrollment) {
                $this->insertAndGetId('supplementary_requests', [
                    'student_id' => $suppStudent->id,
                    'student_course_enrollment_id' => $failedEnrollment->id,
                    'academic_year_id' => $academicYearId,
                    'status' => 'submitted',
                    'student_note' => 'WF test supplementary request.',
                ]);
            }
        }

        $this->info('Academic workflow scenario created successfully.');
        $this->line('Current academic year ID: ' . $academicYearId);
        $this->line('Next academic year ID: ' . $nextAcademicYearId);
        $this->line('Test student numbers: ' . implode(', ', array_column($students, 'number')));
        $this->warn('Run: php artisan workflow:verify-academic-scenario');

        return self::SUCCESS;
    }

    private function deleteScenarioData(): void
    {
        $this->warn('Deleting old WF2030/WF-TST scenario data only...');

        Schema::disableForeignKeyConstraints();

        $studentIds = Schema::hasTable('students')
            ? DB::table('students')->where('student_number', 'like', $this->studentPrefix . '%')->pluck('id')->all()
            : [];

        $userIds = Schema::hasTable('users')
            ? DB::table('users')->where('email', 'like', 'wf.%@test.local')->pluck('id')->all()
            : [];

        $courseIds = Schema::hasTable('courses')
            ? DB::table('courses')->where('code', 'like', $this->coursePrefix . '%')->pluck('id')->all()
            : [];

        $enrollmentIds = Schema::hasTable('student_course_enrollments') && $studentIds
            ? DB::table('student_course_enrollments')->whereIn('student_id', $studentIds)->pluck('id')->all()
            : [];

        if (Schema::hasTable('grade_objections') && $enrollmentIds) {
            $this->deleteWhereInIfColumn('grade_objections', 'student_course_enrollment_id', $enrollmentIds);
        }

        if (Schema::hasTable('supplementary_requests')) {
            if ($studentIds) $this->deleteWhereInIfColumn('supplementary_requests', 'student_id', $studentIds);
            if ($enrollmentIds) $this->deleteWhereInIfColumn('supplementary_requests', 'student_course_enrollment_id', $enrollmentIds);
        }

        if (Schema::hasTable('supplementary_exam_requests')) {
            if ($studentIds) $this->deleteWhereInIfColumn('supplementary_exam_requests', 'student_id', $studentIds);
            if ($enrollmentIds) $this->deleteWhereInIfColumn('supplementary_exam_requests', 'student_course_enrollment_id', $enrollmentIds);
        }

        if (Schema::hasTable('attendance_records') && $enrollmentIds) {
            $this->deleteWhereInIfColumn('attendance_records', 'student_course_enrollment_id', $enrollmentIds);
        }

        if (Schema::hasTable('student_course_grades') && $enrollmentIds) {
            $this->deleteWhereInIfColumn('student_course_grades', 'student_course_enrollment_id', $enrollmentIds);
            $this->deleteWhereInIfColumn('student_course_grades', 'enrollment_id', $enrollmentIds);
        }

        if (Schema::hasTable('student_course_enrollments') && $studentIds) {
            DB::table('student_course_enrollments')->whereIn('student_id', $studentIds)->delete();
        }

        if (Schema::hasTable('student_academic_records') && $studentIds) {
            DB::table('student_academic_records')->whereIn('student_id', $studentIds)->delete();
        }

        if (Schema::hasTable('students') && $studentIds) {
            DB::table('students')->whereIn('id', $studentIds)->delete();
        }

        if (Schema::hasTable('users') && $userIds) {
            DB::table('users')->whereIn('id', $userIds)->delete();
        }

        if (Schema::hasTable('study_plan_courses') && $courseIds) {
            DB::table('study_plan_courses')->whereIn('course_id', $courseIds)->delete();
        }

        if (Schema::hasTable('courses') && $courseIds) {
            DB::table('courses')->whereIn('id', $courseIds)->delete();
        }

        if (Schema::hasTable('study_plans')) {
            DB::table('study_plans')->where('name', 'like', 'WF Test%')->delete();
        }

        if (Schema::hasTable('academic_years')) {
            DB::table('academic_years')->whereIn('name', [$this->yearName, $this->nextYearName])->delete();
        }

        if (Schema::hasTable('departments')) {
            DB::table('departments')->where('code', 'WF-TST')->delete();
        }

        Schema::enableForeignKeyConstraints();
    }

    private function firstId(string $table): ?int
    {
        return DB::table($table)->value('id');
    }

    private function firstOrCreateStudyYear(int $programId, int $yearNumber, string $name): int
    {
        $query = DB::table('study_years')->where('year_number', $yearNumber);
        if (Schema::hasColumn('study_years', 'program_id')) {
            $query->where('program_id', $programId);
        }

        $existing = $query->first();
        if ($existing) return (int) $existing->id;

        return $this->insertAndGetId('study_years', [
            'program_id' => $programId,
            'year_number' => $yearNumber,
            'name' => $name,
        ]);
    }

    private function firstOrCreateAcademicYear(string $name, bool $current, bool $closed, string $start, string $end): int
    {
        $existing = DB::table('academic_years')->where('name', $name)->first();
        if ($existing) return (int) $existing->id;

        return $this->insertAndGetId('academic_years', [
            'name' => $name,
            'is_current' => $current,
            'is_closed' => $closed,
            'start_date' => $start,
            'end_date' => $end,
        ]);
    }

    private function firstOrCreateDepartment(): int
    {
        $existing = DB::table('departments')->where('code', 'WF-TST')->first();
        if ($existing) return (int) $existing->id;

        return $this->insertAndGetId('departments', [
            'name' => 'WF Test Department',
            'code' => 'WF-TST',
            'description' => 'Test department for academic workflow checks',
            'is_active' => true,
        ]);
    }

    private function createCourses(int $departmentId): array
    {
        $ids = [];

        for ($i = 1; $i <= 8; $i++) {
            $code = sprintf('%s-%03d', $this->coursePrefix, $i);
            $existing = DB::table('courses')->where('code', $code)->first();

            $ids[] = $existing
                ? (int) $existing->id
                : $this->insertAndGetId('courses', [
                    'department_id' => $departmentId,
                    'code' => $code,
                    'name' => 'WF Test Course ' . $i,
                    'credit_hours' => 3,
                    'max_mark' => 100,
                    'pass_mark' => 60,
                    'description' => 'Workflow test course',
                    'is_active' => true,
                ]);
        }

        return $ids;
    }

    private function createStudyPlan(int $programId, int $studyYearId, array $courseIds): int
    {
        $plan = DB::table('study_plans')->where('name', 'WF Test First Year Plan')->first();

        $planId = $plan
            ? (int) $plan->id
            : $this->insertAndGetId('study_plans', [
                'program_id' => $programId,
                'study_year_id' => $studyYearId,
                'specialization_id' => null,
                'semester_number' => 1,
                'name' => 'WF Test First Year Plan',
                'is_active' => true,
                'notes' => 'Created for workflow testing',
            ]);

        foreach ($courseIds as $index => $courseId) {
            $exists = DB::table('study_plan_courses')
                ->where('study_plan_id', $planId)
                ->where('course_id', $courseId)
                ->exists();

            if (!$exists) {
                $this->insertAndGetId('study_plan_courses', [
                    'study_plan_id' => $planId,
                    'course_id' => $courseId,
                    'is_mandatory' => true,
                    'display_order' => $index + 1,
                ]);
            }
        }

        return $planId;
    }

    private function createStudent(array $data, int $programId): int
    {
        $user = DB::table('users')->where('email', $data['email'])->first();

        $userId = $user
            ? (int) $user->id
            : $this->insertAndGetId('users', [
                'full_name' => $data['name'],
                'father_name' => 'WF Father',
                'mother_name' => 'WF Mother',
                'birth_date' => '2010-01-01',
                'birth_place' => 'Damascus',
                'central_registry' => 'WF-REG',
                'national_id' => '9' . substr($data['number'], -7),
                'nationality' => 'syrian',
                'gender' => 'male',
                'mobile' => '0999999999',
                'address' => 'WF Test Address',
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'type' => 'student',
            ]);

        $student = DB::table('students')->where('student_number', $data['number'])->first();

        return $student
            ? (int) $student->id
            : $this->insertAndGetId('students', [
                'user_id' => $userId,
                'student_number' => $data['number'],
                'program_id' => $programId,
                'specialization_id' => null,
                'is_active_registration' => true,
                'is_exhausted' => false,
                'notes' => $data['note'],
            ]);
    }

    private function upsertGrade(int $enrollmentId, array $marks): void
    {
        $foreignKey = Schema::hasColumn('student_course_grades', 'student_course_enrollment_id')
            ? 'student_course_enrollment_id'
            : 'enrollment_id';

        $data = array_merge([$foreignKey => $enrollmentId], $marks);
        $data = $this->filterColumns('student_course_grades', $data);

        DB::table('student_course_grades')->updateOrInsert(
            [$foreignKey => $enrollmentId],
            $this->withTimestamps('student_course_grades', $data, false)
        );
    }

    private function insertAndGetId(string $table, array $data): int
    {
        $data = $this->filterColumns($table, $data);
        $data = $this->withTimestamps($table, $data, true);

        return (int) DB::table($table)->insertGetId($data);
    }

    private function filterColumns(string $table, array $data): array
    {
        return collect($data)
            ->filter(fn ($value, $column) => Schema::hasColumn($table, $column))
            ->all();
    }

    private function withTimestamps(string $table, array $data, bool $insert): array
    {
        $now = now();

        if ($insert && Schema::hasColumn($table, 'created_at') && !array_key_exists('created_at', $data)) {
            $data['created_at'] = $now;
        }

        if (Schema::hasColumn($table, 'updated_at') && !array_key_exists('updated_at', $data)) {
            $data['updated_at'] = $now;
        }

        return $data;
    }

    private function deleteWhereInIfColumn(string $table, string $column, array $ids): void
    {
        if ($ids && Schema::hasColumn($table, $column)) {
            DB::table($table)->whereIn($column, $ids)->delete();
        }
    }
}
