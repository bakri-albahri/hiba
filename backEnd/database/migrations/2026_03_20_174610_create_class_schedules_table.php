<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_schedules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('program_id')
                ->constrained('programs')
                ->cascadeOnDelete();

            $table->foreignId('study_year_id')
                ->constrained('study_years')
                ->cascadeOnDelete();

            $table->foreignId('specialization_id')
                ->nullable()
                ->constrained('specializations')
                ->nullOnDelete();

            $table->unsignedTinyInteger('semester_number');
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_schedules');
    }
};

