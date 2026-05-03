<?php

namespace App\Observers;

use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Student;
use App\Models\User;

class StudentObserver
{
    public function created(Student $student): void
    {
        if ($student->user) {
            $student->user->syncRoles([]);
            $student->user->syncPermissions([]);
            $student->user->assignRole('student');
            $student->user->update(['type' => 'student']);
        }
    }

    public function deleted(Student $student): void
    {
        if (!$student->user) {
            return;
        }

        $this->refreshUserTypeAndRoles($student->user);
    }

    private function refreshUserTypeAndRoles(User $user): void
    {
        $hasEmployee = Employee::where('user_id', $user->id)->exists();
        $hasDoctor = Doctor::where('user_id', $user->id)->exists();
        $hasStudent = Student::where('user_id', $user->id)->exists();

        $user->syncRoles([]);
        $user->syncPermissions([]);

        if ($hasEmployee) {
            $employee = Employee::with('department')->where('user_id', $user->id)->first();

            if ($employee) {
                $employee->syncUserTypeAndRole();
                $employee->syncDepartmentPermissions();
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