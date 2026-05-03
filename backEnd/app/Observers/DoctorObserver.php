<?php

namespace App\Observers;

use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Student;
use App\Models\User;

class DoctorObserver
{
    public function created(Doctor $doctor): void
    {
        if ($doctor->user) {
            $doctor->user->syncRoles([]);
            $doctor->user->syncPermissions([]);
            $doctor->user->assignRole('doctor');
            $doctor->user->update([
                'type' => 'doctor'
            ]);
        }
    }

    public function deleted(Doctor $doctor): void
    {
        if (!$doctor->user) {
            return;
        }

        $this->refreshUserTypeAndRoles($doctor->user);
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
            $user->update([
                'type' => 'doctor'
            ]);
            return;
        }

        if ($hasStudent) {
            $user->assignRole('student');
            $user->update([
                'type' => 'student'
            ]);
            return;
        }

        $user->update([
            'type' => 'none'
        ]);
    }
}