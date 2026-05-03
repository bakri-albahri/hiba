<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'old_status',
        'new_status',
        'reason',
        'changed_by_user_id',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}