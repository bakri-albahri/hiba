<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_service_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('student_service_requests', 'attachment_path')) {
                $table->string('attachment_path')->nullable()->after('staff_response');
            }

            if (!Schema::hasColumn('student_service_requests', 'attachment_original_name')) {
                $table->string('attachment_original_name')->nullable()->after('attachment_path');
            }

            if (!Schema::hasColumn('student_service_requests', 'attachment_mime_type')) {
                $table->string('attachment_mime_type')->nullable()->after('attachment_original_name');
            }

            if (!Schema::hasColumn('student_service_requests', 'attachment_size')) {
                $table->unsignedBigInteger('attachment_size')->nullable()->after('attachment_mime_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('student_service_requests', function (Blueprint $table) {
            $columns = [
                'attachment_path',
                'attachment_original_name',
                'attachment_mime_type',
                'attachment_size',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('student_service_requests', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
