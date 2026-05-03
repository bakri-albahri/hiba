<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $fillable = [
        'name',
        'level',
        'total_years',
    ];

    public function specializations()
    {
        return $this->hasMany(Specialization::class);
    }

    public function studyYears()
    {
        return $this->hasMany(StudyYear::class);
    }

    public function studyPlans()
    {
        return $this->hasMany(StudyPlan::class);
    }

    public function classSchedules()
    {
        return $this->hasMany(ClassSchedule::class);
    }
}