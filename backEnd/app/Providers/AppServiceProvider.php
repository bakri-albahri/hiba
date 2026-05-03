<?php

namespace App\Providers;

use App\Models\Department;
use App\Models\Doctor;
use App\Models\Employee;
use App\Models\Student;
use App\Models\StudentCourseGrade;
use App\Observers\DepartmentObserver;
use App\Observers\DoctorObserver;
use App\Observers\EmployeeObserver;
use App\Observers\StudentCourseGradeObserver;
use App\Observers\StudentObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Employee::observe(EmployeeObserver::class);
        Department::observe(DepartmentObserver::class);
        Student::observe(StudentObserver::class);
        Doctor::observe(DoctorObserver::class);
        StudentCourseGrade::observe(StudentCourseGradeObserver::class);
    }
}