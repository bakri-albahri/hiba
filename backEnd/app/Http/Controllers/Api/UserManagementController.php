<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Program;
use App\Models\Specialization;
use App\Models\Student;
use App\Models\StudyYear;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use App\Services\UserProvisionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class UserManagementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with([
            'student.program',
            'student.specialization',
            'employee.department',
            'doctor.department',
        ])->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        if ($request->filled('email')) {
            $query->where('email', 'like', '%' . $request->string('email') . '%');
        }

        if ($request->filled('name')) {
            $query->where('full_name', 'like', '%' . $request->string('name') . '%');
        }

        $perPage = (int) $request->get('per_page', 20);

        return response()->json($query->paginate($perPage));
    }

    public function show(int $userId): JsonResponse
    {
        $user = User::with([
            'student.program',
            'student.specialization',
            'student.academicRecords.academicYear',
            'student.academicRecords.studyYear',
            'employee.department',
            'employee.managedDepartment',
            'doctor.department',
            'doctor.managedDepartment',
        ])->findOrFail($userId);

        return response()->json($user);
    }

    public function store(
        Request $request,
        UserProvisionService $userProvisionService,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['student', 'employee', 'doctor'])],

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

            // student
            'program_id' => ['nullable', 'exists:programs,id'],
            'specialization_id' => ['nullable', 'exists:specializations,id'],
            'enrollment_date' => ['nullable', 'date'],
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'study_year_id' => ['nullable', 'exists:study_years,id'],
            'registration_status' => ['nullable', Rule::in(['pending', 'registered', 'not_registered', 'stopped'])],
            'tuition_paid' => ['nullable', 'boolean'],

            // employee
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],

            // doctor
            'academic_title' => ['nullable', 'string', 'max:255'],
            'employee_number' => ['nullable', 'string', 'max:255', 'unique:doctors,employee_number'],

            // shared
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        try {
            $this->validateTypeSpecificRequirements($validated);

            $result = $userProvisionService->provision($validated);

            if ($validated['type'] === 'student') {
                $notificationService->sendToStudent(
                    $result['entity'],
                    'student_account_created',
                    'Student Account Created',
                    'Your student account has been created successfully. You can now access the university system.',
                    [
                        'student_id' => $result['entity']->id,
                        'student_number' => $result['entity']->student_number,
                    ]
                );
            }

            if ($validated['type'] === 'doctor') {
                $notificationService->sendToUser(
                    $result['user']->id,
                    null,
                    'doctor_account_created',
                    'Doctor Account Created',
                    'Your doctor account has been created successfully. You can now access the university system.',
                    [
                        'doctor_id' => $result['entity']->id,
                        'employee_number' => $result['entity']->employee_number,
                    ]
                );
            }

            $activityLogService->log(
                optional($request->user())->id,
                'user_created_from_user_management',
                'user',
                $result['user']->id,
                'User Created',
                'A user was created from User Management API.',
                null,
                [
                    'user_id' => $result['user']->id,
                    'type' => $result['user']->type,
                    'email' => $result['user']->email,
                ],
                null,
                $request
            );

            return response()->json([
                'message' => 'User created successfully.',
                'data' => $result,
            ], 201);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function update(
        Request $request,
        int $userId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $user = User::with([
            'student.academicRecords',
            'employee.department',
            'doctor.department',
        ])->findOrFail($userId);

        $validated = $request->validate([
            'type' => ['nullable', Rule::in(['student', 'employee', 'doctor'])],

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
                Rule::unique('users', 'national_id')->ignore($user->id),
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
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],

            // student
            'program_id' => ['nullable', 'exists:programs,id'],
            'specialization_id' => ['nullable', 'exists:specializations,id'],
            'enrollment_date' => ['nullable', 'date'],
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'study_year_id' => ['nullable', 'exists:study_years,id'],
            'registration_status' => ['nullable', Rule::in(['pending', 'registered', 'not_registered', 'stopped'])],
            'tuition_paid' => ['nullable', 'boolean'],

            // employee
            'department_id' => ['nullable', 'exists:departments,id'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],

            // doctor
            'academic_title' => ['nullable', 'string', 'max:255'],
            'employee_number' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],

            // shared
            'notes' => ['nullable', 'string'],
        ]);

        if (!empty($validated['type']) && $validated['type'] !== $user->type) {
            return response()->json([
                'message' => 'Changing user type is not supported. Create a new user with the target type instead.',
            ], 422);
        }

        $oldData = [
            'full_name' => $user->full_name,
            'email' => $user->email,
            'type' => $user->type,
        ];

        DB::transaction(function () use ($user, $validated) {
            $user->update([
                'full_name' => $validated['full_name'] ?? $user->full_name,
                'father_name' => array_key_exists('father_name', $validated) ? $validated['father_name'] : $user->father_name,
                'mother_name' => array_key_exists('mother_name', $validated) ? $validated['mother_name'] : $user->mother_name,
                'birth_date' => array_key_exists('birth_date', $validated) ? $validated['birth_date'] : $user->birth_date,
                'birth_place' => array_key_exists('birth_place', $validated) ? $validated['birth_place'] : $user->birth_place,
                'central_registry' => array_key_exists('central_registry', $validated) ? $validated['central_registry'] : $user->central_registry,
                'national_id' => array_key_exists('national_id', $validated) ? $validated['national_id'] : $user->national_id,
                'nationality' => array_key_exists('nationality', $validated) ? $validated['nationality'] : $user->nationality,
                'gender' => array_key_exists('gender', $validated) ? $validated['gender'] : $user->gender,
                'mobile' => array_key_exists('mobile', $validated) ? $validated['mobile'] : $user->mobile,
                'address' => array_key_exists('address', $validated) ? $validated['address'] : $user->address,
                'email' => $validated['email'] ?? $user->email,
                'password' => $validated['password'] ?? $user->password,
            ]);

            if ($user->type === 'student' && $user->student) {
                $student = $user->student;

                $programId = $validated['program_id'] ?? $student->program_id;
                $program = Program::findOrFail($programId);

                $currentRecord = $student->academicRecords()
                    ->orderByDesc('academic_year_id')
                    ->orderByDesc('id')
                    ->first();

                $studyYearId = $validated['study_year_id'] ?? ($currentRecord?->study_year_id);
                $studyYear = $studyYearId ? StudyYear::findOrFail($studyYearId) : null;

                if ($studyYear && (int) $studyYear->program_id !== (int) $program->id) {
                    throw new InvalidArgumentException('The selected study year does not belong to the selected program.');
                }

                if (!empty($validated['specialization_id'])) {
                    $specialization = Specialization::findOrFail($validated['specialization_id']);

                    if ((int) $specialization->program_id !== (int) $program->id) {
                        throw new InvalidArgumentException('The selected specialization does not belong to the selected program.');
                    }
                }

                if ($studyYear) {
                    $stageValidationError = $this->validateBachelorStageSpecialization(
                        $program,
                        $studyYear,
                        array_key_exists('specialization_id', $validated)
                            ? $validated['specialization_id']
                            : $student->specialization_id
                    );

                    if ($stageValidationError) {
                        throw new InvalidArgumentException($stageValidationError);
                    }
                }

                $student->update([
                    'program_id' => $programId,
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

                if ($currentRecord) {
                    $currentRecord->update([
                        'academic_year_id' => $validated['academic_year_id'] ?? $currentRecord->academic_year_id,
                        'study_year_id' => $validated['study_year_id'] ?? $currentRecord->study_year_id,
                        'registration_status' => $validated['registration_status'] ?? $currentRecord->registration_status,
                        'tuition_paid' => array_key_exists('tuition_paid', $validated)
                            ? $validated['tuition_paid']
                            : $currentRecord->tuition_paid,
                    ]);
                }
            }

            if ($user->type === 'employee' && $user->employee) {
                $user->employee->update([
                    'department_id' => $validated['department_id'] ?? $user->employee->department_id,
                    'job_title' => array_key_exists('job_title', $validated) ? $validated['job_title'] : $user->employee->job_title,
                    'hire_date' => array_key_exists('hire_date', $validated) ? $validated['hire_date'] : $user->employee->hire_date,
                    'is_active' => array_key_exists('is_active', $validated) ? $validated['is_active'] : $user->employee->is_active,
                    'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $user->employee->notes,
                ]);

                $user->employee->refresh()->syncUserTypeAndRole();
            }

            if ($user->type === 'doctor' && $user->doctor) {
                if (!empty($validated['employee_number'])) {
                    $exists = Doctor::where('employee_number', $validated['employee_number'])
                        ->where('id', '!=', $user->doctor->id)
                        ->exists();

                    if ($exists) {
                        throw new InvalidArgumentException('The employee number has already been taken.');
                    }
                }

                $user->doctor->update([
                    'department_id' => array_key_exists('department_id', $validated) ? $validated['department_id'] : $user->doctor->department_id,
                    'academic_title' => array_key_exists('academic_title', $validated) ? $validated['academic_title'] : $user->doctor->academic_title,
                    'employee_number' => array_key_exists('employee_number', $validated) ? $validated['employee_number'] : $user->doctor->employee_number,
                    'is_active' => array_key_exists('is_active', $validated) ? $validated['is_active'] : $user->doctor->is_active,
                    'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $user->doctor->notes,
                ]);

                $user->doctor->refresh()->syncUserTypeAndRole();
            }
        });

        $freshUser = User::with([
            'student.program',
            'student.specialization',
            'student.academicRecords.academicYear',
            'student.academicRecords.studyYear',
            'employee.department',
            'employee.managedDepartment',
            'doctor.department',
            'doctor.managedDepartment',
        ])->findOrFail($userId);

        $activityLogService->log(
            optional($request->user())->id,
            'user_updated_from_user_management',
            'user',
            $freshUser->id,
            'User Updated',
            'A user was updated from User Management API.',
            $oldData,
            [
                'full_name' => $freshUser->full_name,
                'email' => $freshUser->email,
                'type' => $freshUser->type,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $freshUser,
        ]);
    }

    public function destroy(
        Request $request,
        int $userId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $user = User::with([
            'student',
            'employee.managedDepartment',
            'doctor.managedDepartment',
            'doctor.courseAssignments',
        ])->findOrFail($userId);

        $oldData = [
            'user_id' => $user->id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'type' => $user->type,
        ];

        if ($user->employee && $user->employee->managedDepartment) {
            return response()->json([
                'message' => 'Cannot delete this user because the employee is assigned as a department manager.',
            ], 422);
        }

        if ($user->doctor && $user->doctor->managedDepartment) {
            return response()->json([
                'message' => 'Cannot delete this user because the doctor is assigned as a department manager.',
            ], 422);
        }

        if ($user->doctor && $user->doctor->courseAssignments()->exists()) {
            return response()->json([
                'message' => 'Cannot delete this user because the doctor has course assignments.',
            ], 422);
        }

        DB::transaction(function () use ($user) {
            if ($user->student) {
                $user->student->delete();
            }

            if ($user->employee) {
                $user->employee->delete();
            }

            if ($user->doctor) {
                $user->doctor->delete();
            }

            $user->delete();
        });

        $activityLogService->log(
            optional($request->user())->id,
            'user_deleted_from_user_management',
            'user',
            $oldData['user_id'],
            'User Deleted',
            'A user was deleted from User Management API.',
            $oldData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'User deleted successfully.',
        ]);
    }

    private function validateTypeSpecificRequirements(array $validated): void
    {
        if ($validated['type'] === 'student') {
            $required = ['program_id', 'academic_year_id', 'study_year_id'];

            foreach ($required as $field) {
                if (empty($validated[$field])) {
                    throw new InvalidArgumentException("The field {$field} is required for student type.");
                }
            }
        }

        if ($validated['type'] === 'employee') {
            if (empty($validated['department_id'])) {
                throw new InvalidArgumentException('The field department_id is required for employee type.');
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
}