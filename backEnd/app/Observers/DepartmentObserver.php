<?php

namespace App\Observers;

use App\Models\Department;
use App\Models\User;

class DepartmentObserver
{
    public function saved(Department $department): void
    {
        if (!$department->manager_user_id) {
            return;
        }

        $managerUser = User::with(['employee.department', 'doctor.department'])->find($department->manager_user_id);

        if (!$managerUser) {
            return;
        }

        if ($managerUser->employee) {
            $managerUser->employee->syncUserTypeAndRole();
        }

        if ($managerUser->doctor) {
            $managerUser->doctor->syncUserTypeAndRole();
        }
    }

    public function updated(Department $department): void
    {
        if (!$department->wasChanged('manager_user_id')) {
            return;
        }

        $originalManagerUserId = $department->getOriginal('manager_user_id');

        if ($originalManagerUserId) {
            $oldManagerUser = User::with(['employee.department', 'doctor.department'])->find($originalManagerUserId);

            if ($oldManagerUser) {
                if ($oldManagerUser->employee) {
                    $oldManagerUser->employee->syncUserTypeAndRole();
                }

                if ($oldManagerUser->doctor) {
                    $oldManagerUser->doctor->syncUserTypeAndRole();
                }
            }
        }

        if ($department->manager_user_id) {
            $newManagerUser = User::with(['employee.department', 'doctor.department'])->find($department->manager_user_id);

            if ($newManagerUser) {
                if ($newManagerUser->employee) {
                    $newManagerUser->employee->syncUserTypeAndRole();
                }

                if ($newManagerUser->doctor) {
                    $newManagerUser->doctor->syncUserTypeAndRole();
                }
            }
        }
    }
}