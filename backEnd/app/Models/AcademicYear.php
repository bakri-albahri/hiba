<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AcademicYear extends Model
{
    protected $fillable = [
        'name',
        'is_current',
        'is_closed',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'is_current' => 'boolean',
        'is_closed' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];
}