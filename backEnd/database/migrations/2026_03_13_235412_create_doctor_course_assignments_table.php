<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_course_assignments', function (Blueprint $table) {

            $table->id();

            $table->foreignId('doctor_id')
                ->constrained('doctors')
                ->cascadeOnDelete();

            $table->foreignId('course_id')
                ->constrained('courses')
                ->restrictOnDelete();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('semester_number');

            $table->boolean('is_primary')->default(false);

            $table->timestamps();

            $table->unique([
                'doctor_id',
                'course_id',
                'academic_year_id',
                'semester_number'
            ], 'doctor_course_unique_assignment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_course_assignments');
    }
};