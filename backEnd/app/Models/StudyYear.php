<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudyYear extends Model
{
    protected $fillable = [
        'program_id',
        'year_number',
        'name',
    ];

    public function program()
    {
        return $this->belongsTo(Program::class);
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