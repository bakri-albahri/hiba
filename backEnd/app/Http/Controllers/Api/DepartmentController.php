<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        $departments = Department::with([
            'managerUser',
            'managerEmployee.user',
            'managerDoctor.user',
            'employees.user',
            'doctors.user',
        ])->latest()->get();

        return response()->json($departments);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'code' => ['required', 'string', 'max:255', 'unique:departments,code'],
            'description' => ['nullable', 'string'],
            'manager_user_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (!empty($validated['manager_user_id'])) {
            $managerUser = User::findOrFail($validated['manager_user_id']);

            if (!in_array($managerUser->type, ['employee', 'doctor'])) {
                return response()->json([
                    'message' => 'Department manager must be an employee or a doctor.',
                ], 422);
            }

            $existingManagedDepartment = Department::where('manager_user_id', $managerUser->id)->first();

            if ($existingManagedDepartment) {
                return response()->json([
                    'message' => 'This user is already assigned as a manager of another department.',
                ], 422);
            }
        }

        $department = Department::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'description' => $validated['description'] ?? null,
            'manager_user_id' => $validated['manager_user_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        if ($department->managerEmployee) {
            $department->managerEmployee->syncUserTypeAndRole();
        }

        if ($department->managerDoctor) {
            $department->managerDoctor->syncUserTypeAndRole();
        }

        $activityLogService->log(
            optional($request->user())->id,
            'department_created',
            'department',
            $department->id,
            'Department Created',
            'A new department was created.',
            null,
            [
                'name' => $department->name,
                'code' => $department->code,
                'manager_user_id' => $department->manager_user_id,
                'is_active' => $department->is_active,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Department created successfully.',
            'data' => $department->load([
                'managerUser',
                'managerEmployee.user',
                'managerDoctor.user',
            ]),
        ], 201);
    }

    public function show(int $departmentId): JsonResponse
    {
        $department = Department::with([
            'managerUser',
            'managerEmployee.user',
            'managerDoctor.user',
            'employees.user',
            'doctors.user',
            'courses',
        ])->findOrFail($departmentId);

        return response()->json($department);
    }

    public function update(
        Request $request,
        int $departmentId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $department = Department::findOrFail($departmentId);

        $oldDepartmentData = [
            'name' => $department->name,
            'code' => $department->code,
            'description' => $department->description,
            'manager_user_id' => $department->manager_user_id,
            'is_active' => $department->is_active,
        ];

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('departments', 'name')->ignore($department->id),
            ],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('departments', 'code')->ignore($department->id),
            ],
            'description' => ['nullable', 'string'],
            'manager_user_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('manager_user_id', $validated) && !empty($validated['manager_user_id'])) {
            $managerUser = User::findOrFail($validated['manager_user_id']);

            if (!in_array($managerUser->type, ['employee', 'doctor'])) {
                return response()->json([
                    'message' => 'Department manager must be an employee or a doctor.',
                ], 422);
            }

            $existingManagedDepartment = Department::where('manager_user_id', $managerUser->id)
                ->where('id', '!=', $department->id)
                ->first();

            if ($existingManagedDepartment) {
                return response()->json([
                    'message' => 'This user is already assigned as a manager of another department.',
                ], 422);
            }
        }

        $oldManagerUserId = $department->manager_user_id;

        $department->update([
            'name' => $validated['name'] ?? $department->name,
            'code' => $validated['code'] ?? $department->code,
            'description' => array_key_exists('description', $validated)
                ? $validated['description']
                : $department->description,
            'manager_user_id' => array_key_exists('manager_user_id', $validated)
                ? $validated['manager_user_id']
                : $department->manager_user_id,
            'is_active' => array_key_exists('is_active', $validated)
                ? $validated['is_active']
                : $department->is_active,
        ]);

        if ($oldManagerUserId && $oldManagerUserId !== $department->manager_user_id) {
            $oldManagerUser = User::find($oldManagerUserId);

            if ($oldManagerUser?->employee) {
                $oldManagerUser->employee->syncUserTypeAndRole();
            }

            if ($oldManagerUser?->doctor) {
                $oldManagerUser->doctor->syncUserTypeAndRole();
            }
        }

        if ($department->managerEmployee) {
            $department->managerEmployee->syncUserTypeAndRole();
        }

        if ($department->managerDoctor) {
            $department->managerDoctor->syncUserTypeAndRole();
        }

        $activityLogService->log(
            optional($request->user())->id,
            'department_updated',
            'department',
            $department->id,
            'Department Updated',
            'Department data was updated.',
            $oldDepartmentData,
            [
                'name' => $department->fresh()->name,
                'code' => $department->fresh()->code,
                'description' => $department->fresh()->description,
                'manager_user_id' => $department->fresh()->manager_user_id,
                'is_active' => $department->fresh()->is_active,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Department updated successfully.',
            'data' => $department->fresh()->load([
                'managerUser',
                'managerEmployee.user',
                'managerDoctor.user',
                'employees.user',
                'doctors.user',
            ]),
        ]);
    }

    public function destroy(
        Request $request,
        int $departmentId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $department = Department::findOrFail($departmentId);

        if ($department->employees()->exists()) {
            return response()->json([
                'message' => 'Cannot delete department because it has employees.',
            ], 422);
        }

        if ($department->doctors()->exists()) {
            return response()->json([
                'message' => 'Cannot delete department because it has doctors.',
            ], 422);
        }

        if ($department->courses()->exists()) {
            return response()->json([
                'message' => 'Cannot delete department because it has courses.',
            ], 422);
        }

        $oldDepartmentData = [
            'department_id' => $department->id,
            'name' => $department->name,
            'code' => $department->code,
            'manager_user_id' => $department->manager_user_id,
            'is_active' => $department->is_active,
        ];

        $department->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'department_deleted',
            'department',
            $oldDepartmentData['department_id'],
            'Department Deleted',
            'Department was deleted.',
            $oldDepartmentData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Department deleted successfully.',
        ]);
    }
}