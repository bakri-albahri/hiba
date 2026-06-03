<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Keep tuition amounts exact. Do not use FLOAT/DOUBLE for money.
        DB::statement('ALTER TABLE tuition_fees MODIFY amount DECIMAL(15,2) NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE tuition_fees MODIFY amount DECIMAL(12,2) NOT NULL');
    }
};
