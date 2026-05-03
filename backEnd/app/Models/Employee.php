<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'job_title',
        'hire_date',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function managedDepartment()
    {
        return $this->hasOne(Department::class, 'manager_user_id', 'user_id');
    }

    public function isDepartmentManager(): bool
    {
        return $this->managedDepartment()->exists();
    }

    public function syncUserTypeAndRole(): void
    {
        if (!$this->user) {
            return;
        }

        $this->loadMissing('department');

        $this->user->syncRoles([]);
        $this->user->syncPermissions([]);

        if ($this->isDepartmentManager()) {
            $this->user->assignRole('department_manager');
        } else {
            $this->user->assignRole('employee');
        }

        $this->user->update([
            'type' => 'employee',
        ]);

        $this->syncDepartmentPermissions();
    }

    public function syncDepartmentPermissions(): void
    {
        if (!$this->user || !$this->department) {
            return;
        }

        $this->user->syncPermissions($this->department->defaultPermissions());
    }
}