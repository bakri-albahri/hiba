<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('study_years', function (Blueprint $table) {

            $table->id();

            $table->foreignId('program_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->integer('year_number');

            $table->string('name'); 
            // First Year – Second Year

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('study_years');
    }
};
