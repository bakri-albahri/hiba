<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentServiceRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'submitted_by_user_id',
        'reviewed_by_user_id',
        'request_type',
        'subject',
        'description',
        'status',
        'priority',
        'metadata',
        'staff_response',
        'reviewed_at',
        'attachment_path',
        'attachment_original_name',
        'attachment_mime_type',
        'attachment_size',
    ];

    protected $casts = [
        'metadata' => 'array',
        'reviewed_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }
}
