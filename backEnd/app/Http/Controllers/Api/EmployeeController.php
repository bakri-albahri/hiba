<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(): JsonResponse
    {
        $employees = Employee::with(['user', 'department', 'managedDepartment'])
            ->latest()
            ->get();

        return response()->json($employees);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
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

            'department_id' => ['required', 'exists:departments,id'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $employee = DB::transaction(function () use ($validated) {
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
                'type' => 'employee',
            ]);

            return Employee::create([
                'user_id' => $user->id,
                'department_id' => $validated['department_id'],
                'job_title' => $validated['job_title'] ?? null,
                'hire_date' => $validated['hire_date'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        $activityLogService->log(
            optional($request->user())->id,
            'employee_created',
            'employee',
            $employee->id,
            'Employee Created',
            'A new employee account was created.',
            null,
            [
                'employee_id' => $employee->id,
                'department_id' => $employee->department_id,
                'job_title' => $employee->job_title,
                'hire_date' => $employee->hire_date,
                'is_active' => $employee->is_active,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Employee created successfully.',
            'data' => $employee->load(['user', 'department']),
        ], 201);
    }

    public function show(int $employeeId): JsonResponse
    {
        $employee = Employee::with(['user', 'department', 'managedDepartment'])
            ->findOrFail($employeeId);

        return response()->json($employee);
    }

    public function update(
        Request $request,
        int $employeeId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $employee = Employee::with('user')->findOrFail($employeeId);

        $oldEmployeeData = [
            'department_id' => $employee->department_id,
            'job_title' => $employee->job_title,
            'hire_date' => $employee->hire_date,
            'is_active' => $employee->is_active,
            'notes' => $employee->notes,
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
                Rule::unique('users', 'national_id')->ignore($employee->user_id),
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
                Rule::unique('users', 'email')->ignore($employee->user_id),
            ],
            'password' => ['nullable', 'string', 'min:8'],

            'department_id' => ['sometimes', 'required', 'exists:departments,id'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($employee, $validated) {
            $employee->user->update([
                'full_name' => $validated['full_name'] ?? $employee->user->full_name,
                'father_name' => array_key_exists('father_name', $validated) ? $validated['father_name'] : $employee->user->father_name,
                'mother_name' => array_key_exists('mother_name', $validated) ? $validated['mother_name'] : $employee->user->mother_name,
                'birth_date' => array_key_exists('birth_date', $validated) ? $validated['birth_date'] : $employee->user->birth_date,
                'birth_place' => array_key_exists('birth_place', $validated) ? $validated['birth_place'] : $employee->user->birth_place,
                'central_registry' => array_key_exists('central_registry', $validated) ? $validated['central_registry'] : $employee->user->central_registry,
                'national_id' => array_key_exists('national_id', $validated) ? $validated['national_id'] : $employee->user->national_id,
                'nationality' => array_key_exists('nationality', $validated) ? $validated['nationality'] : $employee->user->nationality,
                'gender' => array_key_exists('gender', $validated) ? $validated['gender'] : $employee->user->gender,
                'mobile' => array_key_exists('mobile', $validated) ? $validated['mobile'] : $employee->user->mobile,
                'address' => array_key_exists('address', $validated) ? $validated['address'] : $employee->user->address,
                'email' => $validated['email'] ?? $employee->user->email,
                'password' => $validated['password'] ?? $employee->user->password,
            ]);

            $employee->update([
                'department_id' => $validated['department_id'] ?? $employee->department_id,
                'job_title' => array_key_exists('job_title', $validated) ? $validated['job_title'] : $employee->job_title,
                'hire_date' => array_key_exists('hire_date', $validated) ? $validated['hire_date'] : $employee->hire_date,
                'is_active' => array_key_exists('is_active', $validated) ? $validated['is_active'] : $employee->is_active,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $employee->notes,
            ]);
        });

        $freshEmployee = $employee->fresh();

        $freshEmployee->load(['user', 'department', 'managedDepartment'])->syncUserTypeAndRole();

        $activityLogService->log(
            optional($request->user())->id,
            'employee_updated',
            'employee',
            $employee->id,
            'Employee Updated',
            'Employee data was updated.',
            $oldEmployeeData,
            [
                'department_id' => $freshEmployee->department_id,
                'job_title' => $freshEmployee->job_title,
                'hire_date' => $freshEmployee->hire_date,
                'is_active' => $freshEmployee->is_active,
                'notes' => $freshEmployee->notes,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Employee updated successfully.',
            'data' => $freshEmployee->load(['user', 'department', 'managedDepartment']),
        ]);
    }

    public function destroy(
        Request $request,
        int $employeeId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $employee = Employee::with('managedDepartment')->findOrFail($employeeId);

        if ($employee->managedDepartment) {
            return response()->json([
                'message' => 'Cannot delete employee because they are assigned as a department manager.',
            ], 422);
        }

        $oldEmployeeData = [
            'employee_id' => $employee->id,
            'user_id' => $employee->user_id,
            'department_id' => $employee->department_id,
            'job_title' => $employee->job_title,
            'hire_date' => $employee->hire_date,
            'is_active' => $employee->is_active,
        ];

        $employee->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'employee_deleted',
            'employee',
            $oldEmployeeData['employee_id'],
            'Employee Deleted',
            'Employee account was deleted.',
            $oldEmployeeData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Employee deleted successfully.',
        ]);
    }

    public function assignAsDepartmentManager(
        Request $request,
        int $employeeId,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $employee = Employee::with(['department', 'user'])->findOrFail($employeeId);

        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
        ]);

        $department = Department::findOrFail($validated['department_id']);

        if ((int) $employee->department_id !== (int) $department->id) {
            return response()->json([
                'message' => 'Employee must belong to the same department to become its manager.',
            ], 422);
        }

        $alreadyManagerOfAnotherDepartment = Department::where('manager_user_id', $employee->user_id)
            ->where('id', '!=', $department->id)
            ->exists();

        if ($alreadyManagerOfAnotherDepartment) {
            return response()->json([
                'message' => 'This employee is already assigned as a manager of another department.',
            ], 422);
        }

        $oldManagerUserId = $department->manager_user_id;

        $department->update([
            'manager_user_id' => $employee->user_id,
        ]);

        if ($oldManagerUserId && $oldManagerUserId !== $employee->user_id) {
            $oldManagerUser = User::find($oldManagerUserId);

            if ($oldManagerUser?->employee) {
                $oldManagerUser->employee->syncUserTypeAndRole();
            }

            if ($oldManagerUser?->doctor) {
                $oldManagerUser->doctor->syncUserTypeAndRole();
            }
        }

        $employee->syncUserTypeAndRole();

        $notificationService->sendToUser(
            $employee->user_id,
            null,
            'department_manager_assigned',
            'Department Manager Assignment',
            'You have been assigned as the manager of the department "' . $department->name . '".',
            [
                'department_id' => $department->id,
                'department_code' => $department->code,
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'department_manager_assigned',
            'department',
            $department->id,
            'Department Manager Assigned',
            'An employee was assigned as department manager.',
            [
                'old_manager_user_id' => $oldManagerUserId,
            ],
            [
                'new_manager_user_id' => $employee->user_id,
            ],
            [
                'department_code' => $department->code,
            ],
            $request
        );

        return response()->json([
            'message' => 'Employee assigned as department manager successfully.',
            'data' => $department->fresh()->load([
                'managerUser',
                'managerEmployee.user',
                'managerDoctor.user',
                'employees.user',
            ]),
        ]);
    }
}