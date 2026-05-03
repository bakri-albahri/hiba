<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudyPlanCourse extends Model
{
    use HasFactory;

    protected $fillable = [
        'study_plan_id',
        'course_id',
        'is_mandatory',
        'display_order',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
    ];

    public function studyPlan()
    {
        return $this->belongsTo(StudyPlan::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}