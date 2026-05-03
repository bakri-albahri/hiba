<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'academic_title',
        'employee_number',
        'is_active',
        'notes',
    ];

    protected $casts = [
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

    public function courseAssignments()
    {
        return $this->hasMany(DoctorCourseAssignment::class);
    }

    public function courses()
    {
        return $this->belongsToMany(
            Course::class,
            'doctor_course_assignments'
        )->withPivot([
            'academic_year_id',
            'semester_number',
            'is_primary'
        ])->withTimestamps();
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function syncUserTypeAndRole(): void
    {
        if (!$this->user) {
            return;
        }

        $this->user->syncRoles([]);
        $this->user->syncPermissions([]);

        if ($this->isDepartmentManager()) {
            $this->user->assignRole('department_manager');
            $this->syncDepartmentPermissions();
        } else {
            $this->user->assignRole('doctor');
        }

        $this->user->update(['type' => 'doctor']);
    }

    public function syncDepartmentPermissions(): void
    {
        if (!$this->user || !$this->department) {
            return;
        }

        $this->user->syncPermissions($this->department->defaultPermissions());
    }
}