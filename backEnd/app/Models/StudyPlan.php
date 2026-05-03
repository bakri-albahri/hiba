<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'specialization_id',
        'study_year_id',
        'semester_number',
        'name',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function specialization()
    {
        return $this->belongsTo(Specialization::class);
    }

    public function studyYear()
    {
        return $this->belongsTo(StudyYear::class);
    }

    public function studyPlanCourses()
    {
        return $this->hasMany(StudyPlanCourse::class);
    }

    public function courses()
    {
        return $this->belongsToMany(Course::class, 'study_plan_courses')
            ->withPivot(['is_mandatory', 'display_order'])
            ->withTimestamps();
    }
}