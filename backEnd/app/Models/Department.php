<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'manager_user_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function doctors()
    {
        return $this->hasMany(Doctor::class);
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function managerUser()
    {
        return $this->belongsTo(User::class, 'manager_user_id');
    }

    public function managerEmployee()
    {
        return $this->hasOne(Employee::class, 'user_id', 'manager_user_id');
    }

    public function managerDoctor()
    {
        return $this->hasOne(Doctor::class, 'user_id', 'manager_user_id');
    }

    public function defaultPermissions(): array
    {
        return match ($this->code) {
            'student_affairs' => [
                'view undergraduate students',
                'create undergraduate students',
                'update undergraduate students',
                'change undergraduate student status',
                'create undergraduate schedules',
                'manage undergraduate schedules',
                'set course attendance limits',
                'send student notifications',
            ],

            'finance' => [
                'set annual tuition fees',
                'update tuition payment status',
            ],

            'exams' => [
                'close academic year',
                'manage student grades',
                'manage grade objections',
                'manage exam schedules',
                'manage supplementary exam schedules',
                'review supplementary requests',
            ],

            'postgraduate' => [
                'view postgraduate students',
                'create postgraduate students',
                'update postgraduate students',
                'create postgraduate schedules',
                'manage postgraduate schedules',
            ],

            default => [],
        };
    }
}