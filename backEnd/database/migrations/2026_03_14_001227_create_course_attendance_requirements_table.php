<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_attendance_requirements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('semester_number');

            $table->unsignedInteger('required_attendance_count');

            $table->timestamps();

            $table->unique(
                ['course_id', 'academic_year_id', 'semester_number'],
                'car_course_year_sem_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_attendance_requirements');
    }
};