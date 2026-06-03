<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VerifyAcademicWorkflowScenario extends Command
{
    protected $signature = 'workflow:verify-academic-scenario';

    protected $description = 'Verify the academic workflow test scenario before and after closing the academic year.';

    private string $studentPrefix = 'WF2030';
    private string $yearName = 'WF2030-2031';
    private string $nextYearName = 'WF2031-2032';

    public function handle(): int
    {
        $requiredTables = [
            'students',
            'users',
            'academic_years',
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

        $currentYear = DB::table('academic_years')->where('name', $this->yearName)->first();
        $nextYear = DB::table('academic_years')->where('name', $this->nextYearName)->first();

        if (!$currentYear) {
            $this->error('WF scenario was not seeded. Run: php artisan workflow:seed-academic-scenario --fresh');
            return self::FAILURE;
        }

        $students = DB::table('students')
            ->join('users', 'users.id', '=', 'students.user_id')
            ->where('students.student_number', 'like', $this->studentPrefix . '%')
            ->select('students.*', 'users.full_name', 'users.email')
            ->orderBy('students.student_number')
            ->get();

        if ($students->isEmpty()) {
            $this->error('No WF test students found. Run the seed command first.');
            return self::FAILURE;
        }

        $rows = [];
        $gradeFk = Schema::hasColumn('student_course_grades', 'student_course_enrollment_id')
            ? 'student_course_enrollment_id'
            : 'enrollment_id';

        foreach ($students as $student) {
            $marks = DB::table('student_course_enrollments')
                ->join('student_course_grades', "student_course_grades.{$gradeFk}", '=', 'student_course_enrollments.id')
                ->where('student_course_enrollments.student_id', $student->id)
                ->where('student_course_enrollments.academic_year_id', $currentYear->id)
                ->pluck('student_course_grades.final_mark')
                ->map(fn ($mark) => (float) $mark)
                ->all();

            $average = count($marks) ? round(array_sum($marks) / count($marks), 2) : 0;
            $failedCourses = collect($marks)->filter(fn ($mark) => $mark < 60)->count();

            $expected = match (true) {
                $failedCourses === 0 && $average >= 60 => 'passed/promoted',
                $failedCourses > 0 && $failedCourses <= 6 && $average >= 60 => 'promoted_with_carried_courses',
                default => 'failed_or_repeat_year',
            };

            $currentRecord = DB::table('student_academic_records')
                ->where('student_id', $student->id)
                ->where('academic_year_id', $currentYear->id)
                ->first();

            $nextRecord = $nextYear
                ? DB::table('student_academic_records')
                    ->where('student_id', $student->id)
                    ->where('academic_year_id', $nextYear->id)
                    ->first()
                : null;

            $nextEnrollments = $nextYear
                ? DB::table('student_course_enrollments')
                    ->where('student_id', $student->id)
                    ->where('academic_year_id', $nextYear->id)
                    ->count()
                : 0;

            $nextCarried = $nextYear && Schema::hasColumn('student_course_enrollments', 'is_carried')
                ? DB::table('student_course_enrollments')
                    ->where('student_id', $student->id)
                    ->where('academic_year_id', $nextYear->id)
                    ->where('is_carried', true)
                    ->count()
                : 0;

            $rows[] = [
                $student->student_number,
                $student->full_name,
                count($marks),
                $average,
                $failedCourses,
                $expected,
                $currentRecord->academic_result ?? '—',
                $nextRecord ? 'yes' : 'no',
                $nextEnrollments,
                $nextCarried,
            ];
        }

        $this->table([
            'Student #',
            'Name',
            'Marks',
            'Avg',
            'Failed',
            'Expected before closing',
            'Current DB Result',
            'Next Record?',
            'Next Enrollments',
            'Next Carried',
        ], $rows);

        if (Schema::hasTable('supplementary_requests')) {
            $requests = DB::table('supplementary_requests')
                ->whereIn('student_id', $students->pluck('id'))
                ->count();

            $this->line('Supplementary requests in scenario: ' . $requests);
        }

        $this->info('Verification finished.');
        $this->warn('After closing the academic year, run this command again and compare Next Record / Next Enrollments / Next Carried.');

        return self::SUCCESS;
    }
}
