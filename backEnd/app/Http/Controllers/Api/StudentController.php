<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Specialization;
use App\Models\Student;
use App\Models\StudentAcademicRecord;
use App\Models\StudentCourseEnrollment;
use App\Models\StudyPlan;
use App\Models\StudyYear;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ActivityLogService;
use App\Services\StudentNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $students = Student::with([
            'user',
            'program',
            'specialization',
            'academicRecords.academicYear',
            'academicRecords.studyYear',
        ])
            ->latest()
            ->paginate(20);

        return response()->json($students);
    }

    public function show(int $studentId): JsonResponse
    {
        $student = Student::with([
            'user',
            'program',
            'specialization',
            'academicRecords.academicYear',
            'academicRecords.studyYear',
            'courseEnrollments.course',
            'courseEnrollments.grade',
        ])->findOrFail($studentId);

        return response()->json($student);
    }

    public function currentAcademicRecord(int $studentId): JsonResponse
    {
        $student = Student::with([
            'user',
            'program',
            'specialization',
        ])->findOrFail($studentId);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
            ], 404);
        }

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
                'is_active_registration' => $student->is_active_registration,
                'is_exhausted' => $student->is_exhausted,
            ],
            'current_academic_record' => $currentRecord,
        ]);
    }

    public function carriedCourses(int $studentId): JsonResponse
    {
        $student = Student::with([
            'user',
            'program',
            'specialization',
        ])->findOrFail($studentId);

        $currentRecord = $student->academicRecords()
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
            ], 404);
        }

        $carriedEnrollments = $student->courseEnrollments()
            ->with(['course', 'grade', 'academicYear', 'studyYear'])
            ->where('academic_year_id', $currentRecord->academic_year_id)
            ->where('is_carried', true)
            ->get();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
            ],
            'academic_year_id' => $currentRecord->academic_year_id,
            'carried_courses_count' => $carriedEnrollments->count(),
            'carried_courses' => $carriedEnrollments->map(function ($enrollment) {
                return [
                    'enrollment_id' => $enrollment->id,
                    'course_id' => $enrollment->course_id,
                    'course_name' => $enrollment->course?->name,
                    'course_code' => $enrollment->course?->code,
                    'credit_hours' => $enrollment->course?->credit_hours,
                    'study_year' => $enrollment->studyYear?->name,
                    'semester_number' => $enrollment->semester_number,
                    'grade' => [
                        'coursework_mark' => $enrollment->grade?->coursework_mark ?? 0,
                        'practical_mark' => $enrollment->grade?->practical_mark ?? 0,
                        'exam_mark' => $enrollment->grade?->exam_mark ?? 0,
                        'final_mark' => $enrollment->grade?->final_mark ?? 0,
                        'result_status' => $enrollment->grade?->result_status,
                    ],
                ];
            })->values(),
        ]);
    }

    public function academicSummary(int $studentId): JsonResponse
    {
        $student = Student::with([
            'user',
            'program',
            'specialization',
        ])->findOrFail($studentId);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
            ], 404);
        }

        $resultLabel = match ($currentRecord->academic_result) {
            'passed' => 'passed',
            'promoted' => 'promoted',
            'failed' => 'failed',
            'exhausted' => 'exhausted',
            default => 'in_progress',
        };

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'summary' => [
                'academic_year' => $currentRecord->academicYear?->name,
                'study_year' => $currentRecord->studyYear?->name,
                'registration_status' => $currentRecord->registration_status,
                'academic_result' => $currentRecord->academic_result,
                'result_label' => $resultLabel,
                'annual_average' => $currentRecord->annual_average,
                'carried_courses_count' => $currentRecord->carried_courses_count,
                'carried_courses_credit_sum' => $currentRecord->carried_courses_credit_sum,
                'tuition_paid' => $currentRecord->tuition_paid,
                'auto_promoted' => $currentRecord->auto_promoted,
                'consecutive_failures_in_same_year' => $currentRecord->consecutive_failures_in_same_year,
                'is_active_registration' => $student->is_active_registration,
                'is_exhausted' => $student->is_exhausted,
            ],
        ]);
    }

    public function changeMyPassword(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!$user || !$user->student) {
            return response()->json([
                'message' => 'Only authenticated student accounts can change password through this endpoint.',
            ], 403);
        }

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        if (Hash::check($validated['new_password'], $user->password)) {
            return response()->json([
                'message' => 'The new password must be different from the current password.',
            ], 422);
        }

        $user->update([
            'password' => $validated['new_password'],
        ]);

        $activityLogService->log(
            $user->id,
            'student_password_changed',
            'user',
            $user->id,
            'Student Password Changed',
            'The authenticated student changed their password.',
            null,
            [
                'student_id' => $user->student->id,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }

    public function store(
        Request $request,
        NotificationService $notificationService,
        ActivityLogService $activityLogService,
        StudentNumberService $studentNumberService
    ): JsonResponse {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'mother_name' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'central_registry' => ['nullable', 'string', 'max:255'],
            'national_id' => ['nullable', 'string', 'max:255', 'unique:users,national_id'],
            'nationality' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['male', 'female'])],
            'mobile' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],

            'program_id' => ['required', 'exists:programs,id'],
            'specialization_id' => ['nullable', 'exists:specializations,id'],
            'enrollment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],

            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'study_year_id' => ['required', 'exists:study_years,id'],
            'registration_status' => ['nullable', Rule::in(['pending', 'registered', 'not_registered', 'stopped'])],
            'tuition_paid' => ['nullable', 'boolean'],
        ]);

        $program = Program::findOrFail($validated['program_id']);
        $studyYear = StudyYear::findOrFail($validated['study_year_id']);

        if ((int) $studyYear->program_id !== (int) $program->id) {
            return response()->json([
                'message' => 'The selected study year does not belong to the selected program.',
            ], 422);
        }

        if (!empty($validated['specialization_id'])) {
            $specialization = Specialization::findOrFail($validated['specialization_id']);

            if ((int) $specialization->program_id !== (int) $program->id) {
                return response()->json([
                    'message' => 'The selected specialization does not belong to the selected program.',
                ], 422);
            }
        }

        $stageValidationError = $this->validateBachelorStageSpecialization(
            $program,
            $studyYear,
            $validated['specialization_id'] ?? null
        );

        if ($stageValidationError) {
            return response()->json([
                'message' => $stageValidationError,
            ], 422);
        }

        $tuitionPaid = (bool) ($validated['tuition_paid'] ?? false);
        $requestedRegistrationStatus = $validated['registration_status'] ?? null;

        if (!$tuitionPaid && $requestedRegistrationStatus === 'registered') {
            return response()->json([
                'message' => 'A student cannot be registered while tuition is not paid.',
            ], 422);
        }

        $initialRegistrationStatus = $this->resolveInitialRegistrationStatus(
            $tuitionPaid,
            $requestedRegistrationStatus
        );

        $isActiveRegistration = $initialRegistrationStatus === 'registered';

        $student = DB::transaction(function () use (
            $validated,
            $studentNumberService,
            $initialRegistrationStatus,
            $isActiveRegistration,
            $tuitionPaid
        ) {
            $user = User::create([
                'full_name' => $validated['full_name'],
                'father_name' => $validated['father_name'] ?? null,
                'mother_name' => $validated['mother_name'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
                'birth_place' => $validated['birth_place'] ?? null,
                'central_registry' => $validated['central_registry'] ?? null,
                'national_id' => $validated['national_id'] ?? null,
                'nationality' => $validated['nationality'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'mobile' => $validated['mobile'] ?? null,
                'address' => $validated['address'] ?? null,
                'email' => $validated['email'],
                'password' => $validated['password'],
                'type' => 'student',
            ]);

            $student = Student::create([
                'user_id' => $user->id,
                'student_number' => $studentNumberService->generate(),
                'program_id' => $validated['program_id'],
                'specialization_id' => $validated['specialization_id'] ?? null,
                'is_active_registration' => $isActiveRegistration,
                'is_exhausted' => false,
                'enrollment_date' => $validated['enrollment_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            StudentAcademicRecord::create([
                'student_id' => $student->id,
                'academic_year_id' => $validated['academic_year_id'],
                'study_year_id' => $validated['study_year_id'],
                'registration_status' => $initialRegistrationStatus,
                'academic_result' => 'in_progress',
                'annual_average' => null,
                'carried_courses_count' => 0,
                'carried_courses_credit_sum' => 0,
                'tuition_paid' => $tuitionPaid,
                'auto_promoted' => false,
                'consecutive_failures_in_same_year' => 0,
                'notes' => 'Initial academic record created from Student API.',
            ]);

            $this->autoEnrollStudentFromStudyPlans(
                $student,
                (int) $validated['academic_year_id'],
                (int) $validated['study_year_id']
            );

            return $student->load([
                'user',
                'program',
                'specialization',
                'academicRecords.academicYear',
                'academicRecords.studyYear',
                'courseEnrollments.course',
            ]);
        });

        $notificationService->sendToStudent(
            $student,
            'student_account_created',
            'Student Account Created',
            $isActiveRegistration
                ? 'Your student account has been created successfully and your registration is active.'
                : 'Your student account has been created successfully, but your registration is not yet active.',
            [
                'student_id' => $student->id,
                'student_number' => $student->student_number,
                'registration_status' => $initialRegistrationStatus,
                'tuition_paid' => $tuitionPaid,
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'student_created',
            'student',
            $student->id,
            'Student Created',
            'A new student account was created and enrolled automatically in study plan courses.',
            null,
            [
                'student_id' => $student->id,
                'student_number' => $student->student_number,
                'program_id' => $student->program_id,
                'specialization_id' => $student->specialization_id,
                'registration_status' => $initialRegistrationStatus,
                'tuition_paid' => $tuitionPaid,
                'is_active_registration' => $isActiveRegistration,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Student created successfully and enrolled automatically in study plan courses.',
            'data' => $student,
        ], 201);
    }

    public function update(
        Request $request,
        int $studentId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $student = Student::with('user')->findOrFail($studentId);

        $oldStudentData = [
            'student_number' => $student->student_number,
            'program_id' => $student->program_id,
            'specialization_id' => $student->specialization_id,
            'enrollment_date' => $student->enrollment_date,
            'notes' => $student->notes,
        ];

        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'mother_name' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'central_registry' => ['nullable', 'string', 'max:255'],
            'national_id' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('users', 'national_id')->ignore($student->user_id),
            ],
            'nationality' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['male', 'female'])],
            'mobile' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($student->user_id),
            ],
            'password' => ['nullable', 'string', 'min:8'],

            'program_id' => ['sometimes', 'required', 'exists:programs,id'],
            'specialization_id' => ['nullable', 'exists:specializations,id'],
            'enrollment_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $programId = $validated['program_id'] ?? $student->program_id;
        $program = Program::findOrFail($programId);

        if (!empty($validated['specialization_id'])) {
            $specialization = Specialization::findOrFail($validated['specialization_id']);

            if ((int) $specialization->program_id !== (int) $programId) {
                return response()->json([
                    'message' => 'The selected specialization does not belong to the selected program.',
                ], 422);
            }
        }

        $latestRecord = $student->academicRecords()
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if ($latestRecord) {
            $studyYear = StudyYear::find($latestRecord->study_year_id);

            if ($studyYear) {
                $stageValidationError = $this->validateBachelorStageSpecialization(
                    $program,
                    $studyYear,
                    array_key_exists('specialization_id', $validated)
                        ? $validated['specialization_id']
                        : $student->specialization_id
                );

                if ($stageValidationError) {
                    return response()->json([
                        'message' => $stageValidationError,
                    ], 422);
                }
            }
        }

        DB::transaction(function () use ($student, $validated) {
            $student->user->update([
                'full_name' => $validated['full_name'] ?? $student->user->full_name,
                'father_name' => array_key_exists('father_name', $validated) ? $validated['father_name'] : $student->user->father_name,
                'mother_name' => array_key_exists('mother_name', $validated) ? $validated['mother_name'] : $student->user->mother_name,
                'birth_date' => array_key_exists('birth_date', $validated) ? $validated['birth_date'] : $student->user->birth_date,
                'birth_place' => array_key_exists('birth_place', $validated) ? $validated['birth_place'] : $student->user->birth_place,
                'central_registry' => array_key_exists('central_registry', $validated) ? $validated['central_registry'] : $student->user->central_registry,
                'national_id' => array_key_exists('national_id', $validated) ? $validated['national_id'] : $student->user->national_id,
                'nationality' => array_key_exists('nationality', $validated) ? $validated['nationality'] : $student->user->nationality,
                'gender' => array_key_exists('gender', $validated) ? $validated['gender'] : $student->user->gender,
                'mobile' => array_key_exists('mobile', $validated) ? $validated['mobile'] : $student->user->mobile,
                'address' => array_key_exists('address', $validated) ? $validated['address'] : $student->user->address,
                'email' => $validated['email'] ?? $student->user->email,
                'password' => $validated['password'] ?? $student->user->password,
            ]);

            $student->update([
                'program_id' => $validated['program_id'] ?? $student->program_id,
                'specialization_id' => array_key_exists('specialization_id', $validated)
                    ? $validated['specialization_id']
                    : $student->specialization_id,
                'enrollment_date' => array_key_exists('enrollment_date', $validated)
                    ? $validated['enrollment_date']
                    : $student->enrollment_date,
                'notes' => array_key_exists('notes', $validated)
                    ? $validated['notes']
                    : $student->notes,
            ]);
        });

        $freshStudent = $student->fresh();

        $activityLogService->log(
            optional($request->user())->id,
            'student_updated',
            'student',
            $student->id,
            'Student Updated',
            'Student data was updated.',
            $oldStudentData,
            [
                'student_number' => $freshStudent->student_number,
                'program_id' => $freshStudent->program_id,
                'specialization_id' => $freshStudent->specialization_id,
                'enrollment_date' => $freshStudent->enrollment_date,
                'notes' => $freshStudent->notes,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Student updated successfully.',
            'data' => $freshStudent->load([
                'user',
                'program',
                'specialization',
                'academicRecords.academicYear',
                'academicRecords.studyYear',
            ]),
        ]);
    }

    public function changeRegistrationStatus(
        Request $request,
        int $studentId,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $student = Student::findOrFail($studentId);

        $validated = $request->validate([
            'is_active_registration' => ['required', 'boolean'],
            'reason' => ['nullable', 'string'],
        ]);

        $oldStatus = $student->is_active_registration ? 'active' : 'stopped';
        $newStatus = $validated['is_active_registration'] ? 'active' : 'stopped';

        DB::transaction(function () use (
            $student,
            $validated,
            $oldStatus,
            $newStatus,
            $request,
            $notificationService,
            $activityLogService
        ) {
            $student->update([
                'is_active_registration' => $validated['is_active_registration'],
            ]);

            $student->statusHistories()->create([
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'reason' => $validated['reason'] ?? null,
                'changed_by_user_id' => optional($request->user())->id,
            ]);

            $currentRecord = $student->academicRecords()
                ->orderByDesc('academic_year_id')
                ->orderByDesc('id')
                ->first();

            if ($currentRecord) {
                if ($validated['is_active_registration']) {
                    $currentRecord->update([
                        'registration_status' => $currentRecord->tuition_paid ? 'registered' : 'not_registered',
                    ]);
                } else {
                    $currentRecord->update([
                        'registration_status' => 'stopped',
                    ]);
                }
            }

            $notificationService->sendToStudent(
                $student,
                'registration_status_changed',
                'Registration Status Updated',
                $validated['is_active_registration']
                    ? 'Your university registration status has been activated.'
                    : 'Your university registration status has been stopped.',
                [
                    'old_status' => $oldStatus,
                    'new_status' => $newStatus,
                    'reason' => $validated['reason'] ?? null,
                ]
            );

            $activityLogService->log(
                optional($request->user())->id,
                'student_registration_status_changed',
                'student',
                $student->id,
                'Student Registration Status Changed',
                'Student registration status was changed.',
                [
                    'old_status' => $oldStatus,
                ],
                [
                    'new_status' => $newStatus,
                ],
                [
                    'reason' => $validated['reason'] ?? null,
                ],
                $request
            );
        });

        return response()->json([
            'message' => 'Student registration status updated successfully.',
            'data' => $student->fresh()->load([
                'user',
                'program',
                'specialization',
                'academicRecords',
                'statusHistories',
            ]),
        ]);
    }

    private function autoEnrollStudentFromStudyPlans(
        Student $student,
        int $academicYearId,
        int $studyYearId
    ): void {
        $studyPlansQuery = StudyPlan::with('courses')
            ->where('program_id', $student->program_id)
            ->where('study_year_id', $studyYearId)
            ->where('is_active', true);

        if ($student->specialization_id) {
            $studyPlansQuery->where(function ($query) use ($student) {
                $query->where('specialization_id', $student->specialization_id)
                    ->orWhereNull('specialization_id');
            });
        } else {
            $studyPlansQuery->whereNull('specialization_id');
        }

        $studyPlans = $studyPlansQuery->get();

        foreach ($studyPlans as $studyPlan) {
            foreach ($studyPlan->courses as $course) {
                StudentCourseEnrollment::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'course_id' => $course->id,
                        'academic_year_id' => $academicYearId,
                    ],
                    [
                        'study_year_id' => $studyYearId,
                        'semester_number' => $studyPlan->semester_number,
                        'is_carried' => false,
                        'is_supplementary' => false,
                        'status' => 'enrolled',
                        'notes' => 'Automatically enrolled from study plan during student creation.',
                    ]
                );
            }
        }
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

    private function resolveInitialRegistrationStatus(bool $tuitionPaid, ?string $requestedStatus): string
    {
        if ($tuitionPaid) {
            return 'registered';
        }

        if ($requestedStatus === 'stopped') {
            return 'stopped';
        }

        return 'not_registered';
    }
}