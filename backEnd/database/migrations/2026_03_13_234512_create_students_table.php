<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->string('student_number')->unique();

            $table->foreignId('program_id')->constrained('programs')->restrictOnDelete();

            $table->foreignId('specialization_id')->nullable()->constrained('specializations')->nullOnDelete();

            $table->boolean('is_active_registration')->default(true);
            $table->boolean('is_exhausted')->default(false);

            $table->date('enrollment_date')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};