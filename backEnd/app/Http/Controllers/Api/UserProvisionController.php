<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use App\Services\UserProvisionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class UserProvisionController extends Controller
{
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
                'user_provisioned',
                $validated['type'],
                $result['entity']->id,
                'User Provisioned',
                'A user was created and automatically added to the specialized table.',
                null,
                [
                    'user_id' => $result['user']->id,
                    'type' => $validated['type'],
                    'entity_id' => $result['entity']->id,
                    'email' => $result['user']->email,
                ],
                null,
                $request
            );

            return response()->json([
                'message' => 'User created and provisioned successfully.',
                'data' => $result,
            ], 201);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
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
}