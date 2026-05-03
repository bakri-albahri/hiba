<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassSchedule extends Model
{
    protected $fillable = [
        'program_id',
        'study_year_id',
        'specialization_id',
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

    public function studyYear()
    {
        return $this->belongsTo(StudyYear::class);
    }

    public function specialization()
    {
        return $this->belongsTo(Specialization::class);
    }

    public function items()
    {
        return $this->hasMany(ClassScheduleItem::class);
    }
}