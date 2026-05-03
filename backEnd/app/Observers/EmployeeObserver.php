<?php

namespace App\Observers;

use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Student;
use App\Models\User;

class EmployeeObserver
{
    public function created(Employee $employee): void
    {
        $employee->load(['user', 'department']);
        $employee->syncUserTypeAndRole();
        $employee->syncDepartmentPermissions();
    }

    public function updated(Employee $employee): void
    {
        $employee->load(['user', 'department']);
        $employee->syncUserTypeAndRole();
        $employee->syncDepartmentPermissions();
    }

    public function deleted(Employee $employee): void
    {
        if (!$employee->user) {
            return;
        }

        $this->refreshUserTypeAndRoles($employee->user);
    }

    private function refreshUserTypeAndRoles(User $user): void
    {
        $hasEmployee = Employee::where('user_id', $user->id)->exists();
        $hasDoctor = Doctor::where('user_id', $user->id)->exists();
        $hasStudent = Student::where('user_id', $user->id)->exists();

        $user->syncRoles([]);
        $user->syncPermissions([]);

        if ($hasEmployee) {
            $remainingEmployee = Employee::with('department')->where('user_id', $user->id)->first();

            if ($remainingEmployee) {
                $remainingEmployee->syncUserTypeAndRole();
                $remainingEmployee->syncDepartmentPermissions();
                return;
            }
        }

        if ($hasDoctor) {
            $user->assignRole('doctor');
            $user->update(['type' => 'doctor']);
            return;
        }

        if ($hasStudent) {
            $user->assignRole('student');
            $user->update(['type' => 'student']);
            return;
        }

        $user->update(['type' => 'none']);
    }
}