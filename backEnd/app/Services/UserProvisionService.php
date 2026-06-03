<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Program;
use App\Models\Specialization;
use App\Models\Student;
use App\Models\StudentAcademicRecord;
use App\Models\StudyYear;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class UserProvisionService
{
    public function __construct(
        protected StudentNumberService $studentNumberService,
        protected StudentAutoEnrollmentService $studentAutoEnrollmentService
    ) {
    }

    public function provision(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $type = $data['type'];

            $user = User::create([
                'full_name' => $data['full_name'],
                'father_name' => $data['father_name'] ?? null,
                'mother_name' => $data['mother_name'] ?? null,
                'birth_date' => $data['birth_date'] ?? null,
                'birth_place' => $data['birth_place'] ?? null,
                'central_registry' => $data['central_registry'] ?? null,
                'national_id' => $data['national_id'] ?? null,
                'nationality' => $data['nationality'] ?? null,
                'gender' => $data['gender'] ?? null,
                'mobile' => $data['mobile'] ?? null,
                'address' => $data['address'] ?? null,
                'email' => $data['email'],
                'password' => $data['password'],
                'type' => $type,
            ]);

            $autoEnrollment = null;

            $entity = match ($type) {
                'student' => $this->createStudent($user, $data, $autoEnrollment),
                'employee' => $this->createEmployee($user, $data),
                'doctor' => $this->createDoctor($user, $data),
                default => throw new InvalidArgumentException('Unsupported user type.'),
            };

            return [
                'user' => $user->fresh(),
                'type' => $type,
                'entity' => $entity,
                'auto_enrollment' => $autoEnrollment,
            ];
        });
    }

    private function createStudent(User $user, array $data, ?array &$autoEnrollment = null): Student
    {
        $program = Program::findOrFail($data['program_id']);
        $studyYear = StudyYear::findOrFail($data['study_year_id']);

        if ((int) $studyYear->program_id !== (int) $program->id) {
            throw new InvalidArgumentException('The selected study year does not belong to the selected program.');
        }

        if (!empty($data['specialization_id'])) {
            $specialization = Specialization::findOrFail($data['specialization_id']);

            if ((int) $specialization->program_id !== (int) $program->id) {
                throw new InvalidArgumentException('The selected specialization does not belong to the selected program.');
            }
        }

        $stageValidationError = $this->validateBachelorStageSpecialization(
            $program,
            $studyYear,
            $data['specialization_id'] ?? null
        );

        if ($stageValidationError) {
            throw new InvalidArgumentException($stageValidationError);
        }

        $student = Student::create([
            'user_id' => $user->id,
            'student_number' => $this->studentNumberService->generate(),
            'program_id' => $data['program_id'],
            'specialization_id' => $data['specialization_id'] ?? null,
            'is_active_registration' => true,
            'is_exhausted' => false,
            'enrollment_date' => $data['enrollment_date'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        StudentAcademicRecord::create([
            'student_id' => $student->id,
            'academic_year_id' => $data['academic_year_id'],
            'study_year_id' => $data['study_year_id'],
            'registration_status' => $data['registration_status'] ?? 'registered',
            'academic_result' => 'in_progress',
            'annual_average' => null,
            'carried_courses_count' => 0,
            'carried_courses_credit_sum' => 0,
            'tuition_paid' => $data['tuition_paid'] ?? false,
            'auto_promoted' => false,
            'consecutive_failures_in_same_year' => 0,
            'notes' => 'Initial academic record created from User Provision API.',
        ]);

        $autoEnrollment = $this->studentAutoEnrollmentService->autoEnroll(
            $student,
            (int) $data['academic_year_id'],
            (int) $data['study_year_id'],
            'Auto-enrolled immediately after student account creation.'
        );

        return $student->load([
            'user',
            'program',
            'specialization',
            'academicRecords.academicYear',
            'academicRecords.studyYear',
            'courseEnrollments.course',
            'courseEnrollments.academicYear',
            'courseEnrollments.studyYear',
            'courseEnrollments.grade',
        ]);
    }

    private function createEmployee(User $user, array $data): Employee
    {
        return Employee::create([
            'user_id' => $user->id,
            'department_id' => $data['department_id'],
            'job_title' => $data['job_title'] ?? null,
            'hire_date' => $data['hire_date'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'notes' => $data['notes'] ?? null,
        ])->load(['user', 'department']);
    }

    private function createDoctor(User $user, array $data): Doctor
    {
        return Doctor::create([
            'user_id' => $user->id,
            'department_id' => $data['department_id'] ?? null,
            'academic_title' => $data['academic_title'] ?? null,
            'employee_number' => $data['employee_number'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'notes' => $data['notes'] ?? null,
        ])->load(['user', 'department']);
    }

    private function validateBachelorStageSpecialization(
        Program $program,
        StudyYear $studyYear,
        $specializationId
    ): ?string {
        $isBachelorFiveYears = $program->level === 'bachelor' && (int) $program->total_years === 5;

        if (!$isBachelorFiveYears) {
            return null;
        }

        $yearNumber = (int) $studyYear->year_number;

        if (in_array($yearNumber, [1, 2, 3]) && !empty($specializationId)) {
            return 'For the first stage of the bachelor program (years 1 to 3), specialization must not be selected.';
        }

        if (in_array($yearNumber, [4, 5]) && empty($specializationId)) {
            return 'For the second stage of the bachelor program (years 4 and 5), specialization is required.';
        }

        return null;
    }
}
