<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;

class ActivityLogService
{
    public function __construct(
        protected NotificationService $notificationService
    ) {
    }

    public function log(
        ?int $userId,
        string $action,
        string $targetType,
        ?int $targetId,
        string $title,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $meta = null,
        ?Request $request = null
    ): ActivityLog {
        $log = ActivityLog::create([
            'user_id' => $userId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'title' => $title,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'meta' => $meta,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);

        $log->load('user');

        $performedByName = $log->user?->full_name ?? 'System';
        $performedById = $log->user?->id;

        $this->notificationService->sendToAllSuperAdmins(
            'admin_crud_activity',
            $title,
            $description ?? 'A new administrative activity has been recorded.',
            [
                'activity_log_id' => $log->id,
                'action' => $log->action,
                'target_type' => $log->target_type,
                'target_id' => $log->target_id,
                'title' => $log->title,
                'description' => $log->description,
                'performed_by_user_id' => $performedById,
                'performed_by_name' => $performedByName,
                'performed_at' => $log->created_at,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'meta' => $log->meta,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
            ]
        );

        return $log;
    }
}