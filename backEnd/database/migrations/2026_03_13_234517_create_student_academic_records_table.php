<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_academic_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();

            $table->foreignId('academic_year_id')->constrained('academic_years')->restrictOnDelete();

            $table->foreignId('study_year_id')->constrained('study_years')->restrictOnDelete();

            $table->enum('registration_status', [
                'pending',
                'registered',
                'not_registered',
                'stopped',
            ])->default('pending');

            $table->enum('academic_result', [
                'in_progress',
                'passed',
                'promoted',
                'failed',
                'exhausted',
            ])->default('in_progress');

            $table->decimal('annual_average', 5, 2)->nullable()->default(null);

            $table->unsignedInteger('carried_courses_count')->default(0);
            $table->unsignedInteger('carried_courses_credit_sum')->default(0);

            $table->boolean('tuition_paid')->default(false);

            $table->string('payment_receipt_number')->nullable();
            $table->date('payment_receipt_date')->nullable();

            $table->boolean('auto_promoted')->default(false);

            $table->unsignedInteger('consecutive_failures_in_same_year')->default(0);

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['student_id', 'academic_year_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_academic_records');
    }
};