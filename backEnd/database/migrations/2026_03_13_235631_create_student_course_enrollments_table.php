<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_course_enrollments', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Relations
            |--------------------------------------------------------------------------
            */
            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->cascadeOnDelete();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->foreignId('study_year_id')
                ->constrained('study_years')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Academic information
            |--------------------------------------------------------------------------
            */
            $table->unsignedTinyInteger('semester_number');

            /*
            |--------------------------------------------------------------------------
            | Enrollment status
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_carried')->default(false);
            $table->boolean('is_supplementary')->default(false);
            $table->string('status')->default('enrolled');

            /*
            |--------------------------------------------------------------------------
            | Extra data
            |--------------------------------------------------------------------------
            */
            $table->text('notes')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */
            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Prevent duplicate enrollment
            |--------------------------------------------------------------------------
            | Allow one normal enrollment and one supplementary enrollment
            | for the same student, same course, same academic year.
            |--------------------------------------------------------------------------
            */
            $table->unique(
                ['student_id', 'course_id', 'academic_year_id', 'is_supplementary'],
                'sce_student_course_year_supp_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_course_enrollments');
    }
};