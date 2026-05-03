<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'code',
        'name',
        'credit_hours',
        'max_mark',
        'pass_mark',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function studyPlanCourses()
    {
        return $this->hasMany(StudyPlanCourse::class);
    }

    public function studyPlans()
    {
        return $this->belongsToMany(StudyPlan::class, 'study_plan_courses')
            ->withPivot(['is_mandatory', 'display_order'])
            ->withTimestamps();
    }

    public function doctorAssignments()
    {
        return $this->hasMany(DoctorCourseAssignment::class);
    }

    public function enrollments()
    {
        return $this->hasMany(StudentCourseEnrollment::class);
    }

    public function classScheduleItems()
    {
        return $this->hasMany(ClassScheduleItem::class);
    }
}
